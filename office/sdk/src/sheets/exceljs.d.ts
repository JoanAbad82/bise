// exceljs's internals the sheets module drives (io.ts): its workbook model
// and its xforms, not its XLSX class. They ship as untyped CommonJS; the
// shapes we rely on are named here, the rest stays `any` at the seam.

declare module "exceljs/lib/doc/workbook.js" {
  const Workbook: new () => import("exceljs").Workbook & { model: any };
  export default Workbook;
}

declare module "exceljs/lib/utils/xml-stream.js" {
  const XmlStream: new () => { xml: string };
  export default XmlStream;
}

declare module "exceljs/lib/xlsx/xml/theme1.js" {
  const theme1: string;
  export default theme1;
}

declare module "exceljs/lib/xlsx/rel-type.js" {
  const RelType: Record<string, string>;
  export default RelType;
}

declare module "exceljs/lib/xlsx/xform/*" {
  const Xform: new (options?: any) => any;
  export default Xform;
}
