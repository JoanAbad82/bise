// The viewer's second bundle, office/dist/office-view.js (architect m_23781):
// what draws a docx into a browser page, kept out of office.js so that one
// stays DOM-free for `bise office run`. Loaded only by kit/office/docx.js.
// docx-preview (Apache-2.0) reads the docx with jszip (MIT, taken under MIT).

export { renderAsync as renderDocx } from "docx-preview";
