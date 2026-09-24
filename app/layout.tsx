import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'PILOOP | More Than a Toy',description:'Your PILOOP collection, heart and memories. Private first version.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body><svg width="0" height="0" aria-hidden="true" style={{position:'absolute',pointerEvents:'none'}}><defs><filter id="heart-transparency" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 -5 0 4.5"/><feComposite in2="SourceGraphic" operator="in"/></filter></defs></svg>{children}</body></html>}
