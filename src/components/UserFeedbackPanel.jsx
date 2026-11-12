import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { createFeedback, deleteMyFeedback, getFeedbackRatingOptions, getMyFeedback, updateMyFeedback } from '../api/feedbackApi';
import { getApiError } from '../utils/getApiError';
import './UserFeedbackPanel.css';

const LABELS = {1:'Very Poor',2:'Poor',3:'Average',4:'Good',5:'Excellent'};
export default function UserFeedbackPanel() {
  const navigate = useNavigate();
  const [options,setOptions]=useState([]),[record,setRecord]=useState(null),[rating,setRating]=useState(null),[comment,setComment]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false),[confirm,setConfirm]=useState(false),[revision,setRevision]=useState(0);
  const lock=useRef(false),active=useRef(false),loadedSession=useRef(null);
  const userId=localStorage.getItem('userId'),token=localStorage.getItem('token');
  const isCurrentSession=()=>localStorage.getItem('userId')===userId&&localStorage.getItem('token')===token;
  useEffect(()=>{active.current=true;return()=>{active.current=false}},[]);
  useEffect(()=>{
    let current=true;const controller=new AbortController();loadedSession.current=null;setConfirm(false);setLoading(true);setError('');
    Promise.all([getFeedbackRatingOptions(controller.signal),getMyFeedback(controller.signal)]).then(([values,data])=>{
      if(!current||!isCurrentSession())return;
      if(!Array.isArray(values)||!values.length||!values.every(row=>Number.isInteger(row.value)&&row.value>=1&&row.value<=5))throw new Error('Unsupported rating-options response.');
      // The API normalizes only the verified no-feedback 404 to null.
      if(data!=null&&(typeof data!=='object'||Array.isArray(data)||!Number.isInteger(data.rating)||!values.some(row=>row.value===data.rating)||(data.comment!=null&&typeof data.comment!=='string')||(data.userId!=null&&String(data.userId)!==userId)))throw new Error('My Feedback returned an unsupported response. Please ask support to confirm its contract.');
      loadedSession.current=token;setOptions(values);setRecord(data??null);setRating(data?.rating??null);setComment(data?.comment??'');
    }).catch(err=>{if(current&&isCurrentSession()){setError(getApiError(err,err.message||'Unable to load your feedback.'));if(err.response?.status===401&&localStorage.getItem('userId')===userId){localStorage.removeItem('token');localStorage.removeItem('systemRole');navigate('/login',{replace:true})}}}).finally(()=>{if(current&&isCurrentSession())setLoading(false)});
    return()=>{current=false;controller.abort()};
  },[userId,token,revision,navigate]);
  const submit=async(remove=false)=>{
    if(lock.current||loading||error||!userId||!token||loadedSession.current!==token||!isCurrentSession())return;
    if(!remove&&(!options.some(row=>row.value===rating)||comment.length>2000)){toast.error('Choose a valid rating and keep your comment within 2000 characters.');return}
    lock.current=true;setBusy(true);
    try{if(remove)await deleteMyFeedback();else if(record)await updateMyFeedback({rating,comment});else await createFeedback({rating,comment});
      if(!active.current||!isCurrentSession())return;
      setConfirm(false);toast.success(remove?'Your feedback was deleted.':record?'Your feedback was updated.':'Thank you for your feedback.');setRevision(value=>value+1);
    }catch(err){if(active.current&&isCurrentSession()){toast.error(getApiError(err,'Unable to save feedback.'));if(err.response?.status===401){localStorage.removeItem('token');localStorage.removeItem('systemRole');navigate('/login',{replace:true})}}}
    finally{lock.current=false;if(active.current&&isCurrentSession())setBusy(false)}
  };
  return <section className="setting-card user-feedback-panel"><h2>My Feedback</h2><p>Share your experience with S-Club. Each account has one feedback record.</p>{loading?<p role="status">Loading your feedback...</p>:error?<p role="alert">{error} <button onClick={()=>setRevision(value=>value+1)}>Retry feedback</button></p>:<>
    {!record&&<p>You haven't submitted any feedback yet.</p>}
    {record&&<p>Your current rating: {record.rating}/5 — {LABELS[record.rating]}</p>}
    {record?.verified === true && <p><strong>Verified Purchase</strong></p>}
    {record && /^\d+$/.test(String(record.orderCode ?? '')) && <p>Order reference: {record.orderCode}</p>}
    <fieldset disabled={busy}><legend>Rating (required)</legend><div className="user-feedback-stars">{options.map(row=><button key={row.value} type="button" aria-pressed={rating===row.value} aria-label={`${row.value} stars — ${LABELS[row.value]}`} onClick={()=>setRating(row.value)}>{'★'.repeat(row.value)} <span>{LABELS[row.value]}</span></button>)}</div><label htmlFor="user-feedback-comment">Comment (optional)</label><textarea id="user-feedback-comment" maxLength={2000} value={comment} onChange={event=>setComment(event.target.value)}/><small>{comment.length}/2000 characters</small></fieldset>
    <div className="user-feedback-actions"><button disabled={busy} onClick={()=>submit()}>{busy?'Saving...':record?'Update Feedback':'Submit Feedback'}</button>{record&&<button disabled={busy} onClick={()=>setConfirm(true)}>Delete My Feedback</button>}</div>
  </>}{confirm&&<div className="user-feedback-backdrop"><section className="user-feedback-dialog" role="dialog" aria-modal="true" aria-label="Delete My Feedback"><h3>Delete My Feedback</h3><p>Permanently delete your feedback? This action cannot be undone.</p><button disabled={busy} onClick={()=>setConfirm(false)}>Cancel</button><button disabled={busy} onClick={()=>submit(true)}>{busy?'Deleting...':'Confirm Delete'}</button></section></div>}</section>;
}
