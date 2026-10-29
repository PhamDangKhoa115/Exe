import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Check, Sparkles } from 'lucide-react';
import SpotlightCard from './reactbits/SpotlightCard';
import StarBorder from './reactbits/StarBorder';
import './PublicMarketing.css';

export default function MarketingCTA() {
  const anchor=useRef(null),[active,setActive]=useState(false),reduced=useReducedMotion();
  useEffect(()=>{
    let visible=false;
    const sync=()=>setActive(visible&&!document.hidden);
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync()},{threshold:0.1});observer.observe(anchor.current);
    document.addEventListener('visibilitychange',sync);
    return()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync)};
  },[]);
  const reveal={initial:reduced?false:{opacity:0,y:14},whileInView:{opacity:1,y:0},viewport:{once:true,amount:0.15}};
  return <div className="marketing-cta-wrap" ref={anchor}>
    <SpotlightCard as="section" className="marketing-cta" spotlightColor="rgba(221, 214, 254, 0.22)" data-active={active} aria-labelledby="marketing-cta-title">
      <div className="marketing-cta-orb marketing-cta-orb-one" aria-hidden="true"/><div className="marketing-cta-orb marketing-cta-orb-two" aria-hidden="true"/>
      <div className="marketing-cta-decoration" aria-hidden="true"><span><i/><i/><i/></span><div><Check size={14}/> Event planned</div><div><Check size={14}/> Team connected</div><div><Check size={14}/> Ready for what’s next</div></div>
      <div className="marketing-cta-copy">
        <motion.span {...reveal} className="marketing-cta-eyebrow"><Sparkles size={15}/> YOUR NEXT CHAPTER STARTS HERE</motion.span>
        <motion.h2 {...reveal} transition={{delay:0.08,duration:0.45}} id="marketing-cta-title">Ready to Take Your Club<br className="marketing-cta-break"/> to the Next Level?</motion.h2>
        <motion.p {...reveal} transition={{delay:0.16,duration:0.45}}>Bring your members, events, documents, and tasks together with S-Club.</motion.p>
        <motion.div {...reveal} transition={{delay:0.24,duration:0.45}}><StarBorder as={Link} to="/register" className="marketing-cta-button" color="#ede9fe" backgroundColor="#ffffff" textColor="#5b21b6" borderColor="#ffffff">Get Started <ArrowUpRight size={17}/></StarBorder><span className="marketing-cta-caption">One workspace. More possibilities.</span></motion.div>
      </div>
    </SpotlightCard>
  </div>;
}
