import type {Metadata,Viewport} from 'next';
import {Shell} from '@/components/shell';
import './globals.css';
export const metadata:Metadata={title:{default:'BrewLite · Cà phê cho ngày của bạn',template:'%s · BrewLite'},description:'Chọn đồ uống yêu thích, đặt trước và nhận tại quầy.',manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg',apple:'/icon-192.png'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#204c3b'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body><Shell>{children}</Shell></body></html>;}
