import type { Metadata } from 'next';
import Calendar from '@/practice/Calendar';
import '@/practice/practice.css';
export const dynamic = 'force-dynamic';
export const metadata:Metadata={title:'Practice Day',description:'Daily practice calendar.',robots:{index:false,follow:false},openGraph:{title:'Practice Day',description:'Daily practice calendar.',images:[]},twitter:{title:'Practice Day',description:'Daily practice calendar.',images:[]}};
export default function Home() {
 return <div className="practice-root"><Calendar/></div>;
}
