// The core's raw layers, exported as `core`: the zip, the XML DOM helpers,
// content types and relationships. The modules use them; an agent uses them
// only for what no module does yet (a custom XML part, a raw attribute).

export { Zip, utf8Decode, utf8Encode } from "./zip.ts";
export { encodeUtf8, decodeUtf8 } from "./utf8.ts";
export { NS, parseXml, writeXml, children, child, descendants, attr, textOf, type Document, type Element, type Node } from "./xml.ts";
export { contentTypes, typeOf, detect, rels, relsPath, resolve, brokenRels, type ContentTypes, type FileKind, type Rel } from "./opc.ts";
export { stable } from "./diff.ts";
