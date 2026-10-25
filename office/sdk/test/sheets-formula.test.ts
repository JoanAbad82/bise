// Every function the sheets evaluator computes, pinned to Excel's rules
// (architect m_23850: a wrong cached value is worse than none, since the
// viewer and Quick Look show it as true). One row per case: the formula,
// and the value Excel gives. A function not in this table is not computed:
// its cell keeps its old result and check() names it.
//
// Inputs on Sheet1: A1 2, A2 3, A3 "a", A4 empty, A5 "4" (text), A6 TRUE,
// A7 ="" (an empty string), A8 -2.5. On Other: A1 7.

import { test } from "node:test";
import assert from "node:assert/strict";
import { sheets } from "../../dist/office.js";

const V = (e: string) => ({ error: e });

const TABLE: [formula: string, want: unknown][] = [
  // arithmetic: blanks are 0, numeric text converts, other text is #VALUE!, TRUE is 1
  ["=A1+A2", 5],
  ["=A1+A4", 2],
  ["=A3+1", V("#VALUE!")],
  ["=A5+1", 5],
  ["=A6+1", 2],
  ["=-A3", V("#VALUE!")],
  ["=1/0", V("#DIV/0!")],
  ["=1/A4", V("#DIV/0!")],
  ["=1+2*3", 7],
  ["=-2^2", 4],
  ["=2^3^2", 64],
  ["=0^-1", V("#DIV/0!")],
  ["=50%", 0.5],
  ["=0.1+0.2", 0.3],
  ["=1/3", 0.333333333333333],
  ["=A1+#N/A", V("#N/A")],
  ["=Other!A1*2", 14],
  // text join
  ['="a"&1.5', "a1.5"],
  ["=1&2", "12"],
  ['=A6&""', "TRUE"],
  ['=A4&"x"', "x"],
  // comparison: numbers < text < booleans, text without case
  ['="a">1', true],
  ['="1"=1', false],
  ['="a"="A"', true],
  ['=A4=""', true],
  ["=A4=0", true],
  ["=TRUE>1", true],
  ["=A1<>A2", true],
  // SUM and friends: in ranges only numbers count; direct args convert
  ["=SUM(A1:A8)", 2.5],
  ['=SUM(A1,"4",TRUE)', 7],
  ['=SUM("a")', V("#VALUE!")],
  ["=SUM(A1,1/0)", V("#DIV/0!")],
  ["=SUM(A4)", 0],
  ["=AVERAGE(A1:A3)", 2.5],
  ["=AVERAGE(A3:A4)", V("#DIV/0!")],
  ["=MIN(A1:A8)", -2.5],
  ["=MAX(A3:A4)", 0],
  ["=MEDIAN(A1:A2,10)", 3],
  ["=MEDIAN(A1:A2,10,20)", 6.5],
  ["=MEDIAN(A3)", V("#NUM!")],
  ["=PRODUCT(A1:A2)", 6],
  ["=PRODUCT(A3:A4)", 0],
  ["=COUNT(A1:A8)", 3],
  ['=COUNT(1,"2","a",TRUE)', 3],
  ["=COUNTA(A1:A8)", 7],
  ["=COUNTBLANK(A1:A8)", 2],
  // rounding: half away from zero, on the decimal value
  ["=ROUND(2.5,0)", 3],
  ["=ROUND(A8,0)", -3],
  ["=ROUND(1.005,2)", 1.01],
  ["=ROUND(1234,-2)", 1200],
  ["=ROUNDUP(1.21,1)", 1.3],
  ["=ROUNDUP(-1.21,1)", -1.3],
  ["=ROUNDDOWN(1.29,1)", 1.2],
  ["=ROUNDDOWN(-1.29,1)", -1.2],
  ["=INT(-1.5)", -2],
  ["=ABS(A8)", 2.5],
  ["=SQRT(16)", 4],
  ["=SQRT(-1)", V("#NUM!")],
  ["=POWER(2,10)", 1024],
  ["=POWER(0,-1)", V("#DIV/0!")],
  ["=MOD(-3,2)", 1],
  ["=MOD(3,-2)", -1],
  ["=MOD(1,0)", V("#DIV/0!")],
  // logic: in ranges text and blanks are skipped; nothing left is #VALUE!
  ["=AND(A1>1,TRUE)", true],
  ["=AND(1,0)", false],
  ["=AND(A3:A4)", V("#VALUE!")],
  ['=AND("a")', V("#VALUE!")],
  ["=OR(A1:A2)", true],
  ["=OR(0,FALSE)", false],
  ["=NOT(0)", true],
  ['=IF(A1>2,"big","small")', "small"],
  ["=IF(A1>2,1)", false],
  ['=IF("a",1,2)', V("#VALUE!")],
  ["=IF(1/0,1,2)", V("#DIV/0!")],
  ['=IFERROR(1/0,"x")', "x"],
  ["=IFERROR(5,0)", 5],
  // text functions
  ["=CONCAT(A1:A3)", "23a"],
  ['=CONCATENATE("x",0.1+0.2)', "x0.3"],
  ["=CONCAT(TRUE)", "TRUE"],
  ["=LEN(A3)", 1],
  ["=LEN(1234.5)", 6],
  ["=LEN(A4)", 0],
  ['=TRIM("  a   b ")', "a b"],
  ['=UPPER("éa")', "ÉA"],
  ['=LOWER("AbC")', "abc"],
  ['=LEFT("hello",2)', "he"],
  ['=LEFT("hello")', "h"],
  ['=LEFT("hello",-1)', V("#VALUE!")],
  ['=RIGHT("hello",3)', "llo"],
  ['=RIGHT("hi",5)', "hi"],
  ['=MID("hello",2,3)', "ell"],
  ['=MID("hello",0,1)', V("#VALUE!")],
  ['=MID("hello",9,2)', ""],
];

// not pinned, so not computed: the cell keeps its old result, check() names it
const UNSUPPORTED = ['=COUNTIF(A1:A2,">1")', '=SUMIF(A1:A2,">1")', "=VLOOKUP(2,A1:A2,1,FALSE)", "=TODAY()", "=MyName*2", '=1E+21&""'];

test("each function the evaluator computes gives Excel's value, edge cases too", async () => {
  const inputs = [[2], [3], ["a"], [null], ["4"], [true], ['=""'], [-2.5]];
  const book = await sheets.create({ rows: inputs, date: new Date(0) });
  book.addSheet("Other", { rows: [[7]] });
  TABLE.forEach(([f], i) => book.range(`C${i + 1}`).set(f));
  const r = book.recalc();
  assert.deepEqual(r.unsupported, []);
  const got = book.range(`C1:C${TABLE.length}`).values().map((row) => row[0]);
  const wrong = TABLE.filter(([, want], i) => JSON.stringify(got[i]) !== JSON.stringify(want)).map(([f, want], i) => `${f}: want ${JSON.stringify(want)}`);
  assert.deepEqual(
    TABLE.map(([f], i) => [f, got[i]]).filter(([f, g]) => JSON.stringify(g) !== JSON.stringify(TABLE.find((t) => t[0] === f)?.[1])),
    [],
    wrong.join("; "),
  );
});

test("what the evaluator cannot pin keeps its old result and is named", async () => {
  const book = await sheets.create({ rows: [[2], [3]], date: new Date(0) });
  UNSUPPORTED.forEach((f, i) => book.range(`C${i + 1}`).set(f));
  const r = book.recalc();
  assert.deepEqual(r.unsupported.map((u) => u.ref), UNSUPPORTED.map((_, i) => `Sheet1!C${i + 1}`));
  assert.deepEqual(book.range(`C1:C${UNSUPPORTED.length}`).values().flat(), UNSUPPORTED.map(() => null));
  assert.equal(book.check().filter((p) => p.code === "no_value").length, UNSUPPORTED.length);
});
