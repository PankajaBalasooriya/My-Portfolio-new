/**
 * The LaTeX-produced CV PDF.
 *
 * Lives in public/ so it is copied verbatim to a stable, shareable URL:
 * https://pankajabalasooriya.me/cv.pdf — keep the filename fixed so links
 * already sent to people keep working when the PDF is updated.
 *
 * The download links render only when the file is actually present, so a
 * missing PDF is an absent button rather than a 404 handed to a reviewer.
 */
import { existsSync } from 'node:fs';

/** Path segment under public/. */
export const CV_PDF = 'cv.pdf';

/** Saved filename when downloaded — meaningful in someone's Downloads folder. */
export const CV_PDF_DOWNLOAD_NAME = 'Pankaja-Balasooriya-CV.pdf';

export const hasCvPdf = existsSync(new URL(`../../public/${CV_PDF}`, import.meta.url));
