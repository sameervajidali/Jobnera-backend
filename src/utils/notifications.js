export function sendNotification({ type, post }) {
  // send to Slack, email, etc.
  console.log('Notification:', type, post?.title);
}
export function sendWebhook({ event, ...data }) {
  // call external API
  console.log('Webhook:', event, data);
}
