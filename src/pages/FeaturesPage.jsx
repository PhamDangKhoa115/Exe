import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Users, Building2, CalendarDays, FileText, Sheet, ClipboardList, Columns3, MessageSquare, Wallet, HandCoins, Bell, ShieldCheck, UserPlus, Network, ArrowUpRight, ArrowDown, Check } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';
import ChromaGrid from '../components/reactbits/ChromaGrid';
import GradientText from '../components/reactbits/GradientText';
import ShinyText from '../components/reactbits/ShinyText';
import StarBorder from '../components/reactbits/StarBorder';
import './FeaturesPage.css';

const FEATURES = [
  { id:'members',title:'Member Management',subtitle:'Keep your member directory organized, review membership requests, and manage club roles.',Icon:Users,accent:'#7c3aed',group:'people' },
  { id:'departments',title:'Department Management',subtitle:'Organize your club into departments and coordinate the people in each team.',Icon:Building2,accent:'#4f46e5',group:'people' },
  { id:'calendar',title:'Event Calendar',subtitle:'Plan club events, review schedules, and keep upcoming activities in view.',Icon:CalendarDays,accent:'#2563eb',group:'operations' },
  { id:'docs',title:'Google Docs',subtitle:'Create and organize club documents, then preview, share, and sync your work.',Icon:FileText,accent:'#2563eb',group:'collaboration' },
  { id:'sheets',title:'Google Sheets',subtitle:'Manage club spreadsheets and update structured information in a connected workspace.',Icon:Sheet,accent:'#15803d',group:'collaboration' },
  { id:'forms',title:'Google Forms',subtitle:'Build club forms, organize questions, and review submitted responses.',Icon:ClipboardList,accent:'#9333ea',group:'collaboration' },
  { id:'tasks',title:'Trello Task Management',subtitle:'Organize work on task boards and follow progress as your team moves forward.',Icon:Columns3,accent:'#0369a1',group:'collaboration' },
  { id:'chat',title:'Team Chat',subtitle:'Keep department conversations together with messages, attachments, and emoji.',Icon:MessageSquare,accent:'#7c3aed',group:'people' },
  { id:'finance',title:'Finance Management',subtitle:'Review club income, expenses, and transactions in one financial workspace.',Icon:Wallet,accent:'#0f766e',group:'operations' },
  { id:'funds',title:'Fund Campaigns',subtitle:'Follow collection progress and contribution status, with proof submission for your own contribution.',Icon:HandCoins,accent:'#b45309',group:'operations' },
  { id:'notifications',title:'Notifications',subtitle:'Follow club announcements and global updates without losing the bigger picture.',Icon:Bell,accent:'#c026d3',group:'operations' },
  { id:'permissions',title:'Google Permissions',subtitle:'Let club presidents manage individual Sheets and Forms permissions for members.',Icon:ShieldCheck,accent:'#4f46e5',group:'people' },
];
const WORKFLOWS = [
  { id:'people',eyebrow:'PEOPLE & ORGANIZATION',title:'Give every team a place to belong.',description:'Bring your membership, departments, and conversations together. Club roles and permissions determine which actions each member can take.',points:['Maintain a clear member directory and review membership requests.','Assign departments and keep team conversations in department chat.','Manage individual Google Sheets and Forms access as club president.'] },
  { id:'collaboration',eyebrow:'DOCUMENTS & DELIVERY',title:'From a shared idea to a finished task.',description:'Use connected Google tools and task boards to organize the work behind your club’s activities.',points:['Create, preview, share, and synchronize club documents.','Manage spreadsheets, form questions, and form responses.','Follow tasks on Trello boards as your team makes progress.'] },
  { id:'operations',eyebrow:'EVENTS & OPERATIONS',title:'Keep the details moving together.',description:'Plan activities, follow club finances, and stay informed from the same platform. Financial and campaign actions follow your club’s role permissions.',points:['Schedule events and review upcoming club activities.','Review income, expenses, transactions, and fund collection progress.','Follow announcements and submit proof for your own fund contribution.'] },
];
const STEPS = [
  { title:'Create Your Account',description:'Get started with your S-Club account.',Icon:UserPlus },
  { title:'Join or Create a Club',description:'Connect with an existing club or create your own.',Icon:Users },
  { title:'Manage Everything Together',description:'Organize members, tasks, events, documents, and activities from one workspace.',Icon:Network },
];

// Lightweight original illustrations, not screenshots or live user data.
function FeaturePreview({ item }) {
  const {Icon,id}=item;
  return <div className={`feature-mini feature-mini-${id}`} aria-hidden="true">
    <div className="feature-mini-window"><span className="feature-mini-dots">● ● ●</span><span>S-Club / {item.title}</span></div>
    <div className="feature-mini-body"><span className="feature-mini-icon"><Icon size={27}/></span>
      <svg viewBox="0 0 230 100" focusable="false" aria-hidden="true">
        {['members','departments','permissions','chat','notifications'].includes(id)?<>{[16,43,70].map((y,index)=><g key={y}><circle cx="23" cy={y+4} r="10" fill="currentColor" opacity=".15"/><text x="23" y={y+7} textAnchor="middle" fontSize="8" fill="currentColor">{['A','J','S'][index]}</text><rect x="43" y={y-1} width={id==='chat'?115-index*19:95} height="5" rx="2" fill="currentColor" opacity=".25"/><rect x="43" y={y+8} width="60" height="3" rx="1" fill="currentColor" opacity=".12"/>{id!=='chat'&&<g><rect x="165" y={y-3} width="42" height="14" rx="7" fill="currentColor" opacity=".12"/><path d={`M181 ${y+4}l3 3 5-6`} fill="none" stroke="currentColor" strokeWidth="1.5"/></g>}</g>)}</>:id==='tasks'?<>{[8,82,156].map((x,index)=><g key={x}><rect x={x} y="7" width="65" height="85" rx="5" fill="currentColor" opacity=".06"/><rect x={x+8} y="16" width="34" height="4" rx="2" fill="currentColor" opacity=".3"/>{Array.from({length:index===0?2:1},(_,n)=><g key={n}><rect x={x+7} y={30+n*28} width="51" height="23" rx="4" fill="white"/><rect x={x+13} y={37+n*28} width="30" height="3" rx="1" fill="currentColor" opacity=".2"/></g>)}</g>)}</>:id==='calendar'?<>{Array.from({length:28},(_,n)=><rect key={n} x={12+n%7*30} y={9+Math.floor(n/7)*22} width="26" height="18" rx="3" fill="currentColor" opacity={n===11||n===19?'.55':'.07'}/>)}<rect x="130" y="34" width="50" height="11" rx="3" fill="currentColor"/></>:['finance','funds'].includes(id)?<>{[22,46,38,65,55,79].map((height,index)=><rect key={index} x={14+index*34} y={90-height} width="22" height={height} rx="4" fill="currentColor" opacity={.15+index*.08}/>)}<path d="M9 93H222" stroke="currentColor" opacity=".2"/></>:id==='sheets'?<>{Array.from({length:20},(_,n)=><rect key={n} x={12+n%4*52} y={8+Math.floor(n/4)*18} width="50" height="16" rx="1" fill="currentColor" opacity={n<4?'.2':'.05'}/>)}<rect x="116" y="44" width="50" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"/></>:<><rect x="26" y="4" width="178" height="92" rx="5" fill="white"/><rect x="42" y="18" width="100" height="6" rx="2" fill="currentColor" opacity=".45"/>{[38,52,66,80].map((y,index)=><g key={y}>{id==='forms'&&<circle cx="46" cy={y+2} r="4" stroke="currentColor" fill="none" opacity=".3"/>}<rect x={id==='forms'?58:42} y={y} width={index===3?80:132} height="4" rx="2" fill="currentColor" opacity=".13"/></g>)}</>}
      </svg>
    </div><small>Illustrative preview</small>
  </div>;
}

export default function FeaturesPage() {
  const reduced=useReducedMotion();
  useEffect(()=>{
    const title='Features | S-Club — Club Management Platform',previousTitle=document.title;document.title=title;
    const restore=[['meta[name="description"]','meta','name','description','content','Explore S-Club features for managing members, departments, events, documents, tasks, communication, and club finances.'],['link[rel="canonical"]','link','rel','canonical','href','https://sclub.io.vn/features']].map(([selector,tag,key,value,attribute,content])=>{
      const existing=document.head.querySelector(selector),element=existing||document.createElement(tag),previous=element.getAttribute(attribute);
      if(!existing){element.setAttribute(key,value);document.head.appendChild(element)}element.setAttribute(attribute,content);
      return()=>{if(element.getAttribute(attribute)!==content)return;if(!existing)element.remove();else if(previous===null)element.removeAttribute(attribute);else element.setAttribute(attribute,previous)};
    });
    return()=>{if(document.title===title)document.title=previousTitle;restore.forEach(fn=>fn())};
  },[]);
  const enter={initial:reduced?false:{opacity:0,y:14},whileInView:{opacity:1,y:0},viewport:{once:true,amount:0.12}};
  const items=FEATURES.map(item=>({...item,url:`#workflow-${item.group}`,preview:<FeaturePreview item={item}/>}));
  return <div className="features-page"><PublicNavbar/><main>
    <section className="features-hero" aria-labelledby="features-title"><motion.div className="features-hero-glow" aria-hidden="true" initial={reduced?false:{opacity:0.2,scale:0.96}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} transition={{duration:1.5}}/><span className="features-eyebrow"><ShinyText text="Explore S-Club Features" color="#6d28d9" shineColor="#a78bfa" speed={4}/></span><h1 id="features-title">Powerful Features for<br/><GradientText colors={['#5271ff','#6d28d9','#5271ff']} className="features-gradient">Every Student Club</GradientText></h1><p>Everything your club needs to organize members, coordinate events, collaborate on tasks, and manage activities in one connected workspace.</p><div className="features-hero-actions"><StarBorder as={Link} to="/register" color="#c4b5fd" backgroundColor="#6d28d9" borderColor="#6d28d9" className="features-primary">Get Started <ArrowUpRight size={17}/></StarBorder><a href="#features-grid" className="features-secondary" onClick={event=>{event.preventDefault();const section=document.getElementById('features-grid');section?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});section?.focus({preventScroll:true})}}>Explore Features <ArrowDown size={16}/></a></div><span className="features-hero-note">Less switching between tools. More time for your club.</span></section>
    <section className="features-section" id="features-grid" tabIndex="-1" aria-labelledby="features-grid-title"><div className="features-section-heading"><div><span className="features-eyebrow">YOUR CLUB, CONNECTED</span><h2 id="features-grid-title">A place for every part of club life.</h2></div><p>Tools that work together, so your people can too. Explore what’s inside your workspace.</p></div><ChromaGrid items={items} columns={3} minCardWidth={270} gap={22} radius={320} softness={0.75} reveal="spotlight" theme="light" cardRadius={18} frame={false} showInfo grayscale={0.35} dim={0} glow={0.25}/></section>
    <section className="features-workflows" aria-labelledby="workflows-title"><div className="features-centered-heading"><span className="features-eyebrow">BUILT FOR THE WAY CLUBS WORK</span><h2 id="workflows-title">Connected tools. A clearer day.</h2></div><div className="features-workflow-grid">{WORKFLOWS.map((workflow,index)=><motion.article {...enter} transition={{duration:0.4,delay:index*.06}} className="features-workflow" id={`workflow-${workflow.id}`} key={workflow.id}><span className="features-eyebrow">{workflow.eyebrow}</span><h3>{workflow.title}</h3><p>{workflow.description}</p><ul>{workflow.points.map(point=><li key={point}><Check size={15} aria-hidden="true"/>{point}</li>)}</ul></motion.article>)}</div></section>
    <section className="features-how" aria-labelledby="how-title"><div className="features-centered-heading"><span className="features-eyebrow">FROM HELLO TO LET’S GO</span><h2 id="how-title">How S-Club Works</h2><p>Start with your people. Build something together.</p></div><div className="features-steps">{STEPS.map(({title,description,Icon},index)=><motion.article {...enter} transition={{duration:0.4,delay:index*.1}} key={title}><span className="features-step-number">0{index+1}</span><Icon size={25} aria-hidden="true"/><h3>{title}</h3><p>{description}</p></motion.article>)}</div></section>
  </main><Footer/></div>;
}
