import type { Metadata } from 'next';
import Calendar from '@/practice/Calendar';
import '@/practice/practice.css';
export const dynamic = 'force-dynamic';
export const metadata:Metadata={title:'Singing Practice',description:'Singing exercise library with examples and rest intervals.',robots:{index:false,follow:false},openGraph:{title:'Singing Practice',description:'Singing exercises and musicianship.',images:[]},twitter:{title:'Singing Practice',description:'Singing exercises and musicianship.',images:[]}};
export default function Home() {
 return <div className="practice-root"><Calendar/></div>;
}
