import API from './api';

export async function getFeedbackRatingOptions(signal) { return (await API.get('/api/feedbacks/rating-options', { signal })).data; }
export async function getMyFeedback(signal) {
  try {
    const { data } = await API.get('/api/feedbacks/me', { signal });
    if (data == null) throw new Error('My Feedback returned an unsupported response.');
    return data;
  } catch (error) {
    const message = error.response?.data?.error;
    if (error.response?.status === 404 && typeof message === 'string' && message.trim() === 'Bạn chưa gửi feedback nào!') return null;
    throw error;
  }
}
export async function createFeedback(body) { return (await API.post('/api/feedbacks', body)).data; }
export async function updateMyFeedback(body) { return (await API.put('/api/feedbacks/me', body)).data; }
export async function deleteMyFeedback() { return (await API.delete('/api/feedbacks/me')).data; }
