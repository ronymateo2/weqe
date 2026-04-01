// Type declaration for the jsPDF UMD build imported directly to bypass
// the "browser" exports condition which causes a webpack chunk 404 in Next.js.
declare module "jspdf/dist/jspdf.umd.min.js" {
  export * from "jspdf";
}
