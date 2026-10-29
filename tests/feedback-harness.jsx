import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import UserFeedbackPanel from '../src/components/UserFeedbackPanel';

// Only loaded by the mocked browser test page; never imported by the app.
const root = createRoot(document.getElementById('root'));
window.renderFeedback = () => root.render(<React.StrictMode><BrowserRouter><UserFeedbackPanel /></BrowserRouter></React.StrictMode>);
window.renderFeedback();
