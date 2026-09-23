import { Announcement } from './types';

export const sendAnnouncementWebhook = async (
  announcement: Announcement,
  platform: 'slack' | 'teams' = 'slack'
): Promise<{ success: boolean; message: string }> => {
  try {
    const webhookUrl =
      platform === 'slack'
        ? process.env.SLACK_WEBHOOK_URL
        : process.env.TEAMS_WEBHOOK_URL;

    if (!webhookUrl) {
      // In demo mode or when webhook not configured, simulate success
      console.log(`[Webhook Simulator] Broadcast to ${platform} for: ${announcement.title}`);
      return { success: true, message: `Simulated: Sent to ${platform} webhook successfully!` };
    }

    const priorityEmoji =
      announcement.priority === 'URGENT'
        ? '🚨'
        : announcement.priority === 'IMPORTANT'
        ? '🟡'
        : '📢';

    const payload =
      platform === 'slack'
        ? {
            text: `${priorityEmoji} *${announcement.title}*`,
            blocks: [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: `${priorityEmoji} ${announcement.title}`,
                  emoji: true
                }
              },
              {
                type: 'section',
                fields: [
                  {
                    type: 'mrkdwn',
                    text: `*Category:* ${announcement.category}`
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Target:* ${announcement.target_type === 'ALL' ? 'All Company' : announcement.target_value}`
                  }
                ]
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: announcement.summary
                }
              },
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `Posted via *Powerhouse* • ${announcement.requires_acknowledgement ? '⚠️ *Action Required: Mandatory Read*' : 'Informational'}`
                  }
                ]
              }
            ]
          }
        : {
            title: `${priorityEmoji} ${announcement.title}`,
            text: `${announcement.summary}\n\n**Category:** ${announcement.category} | **Audience:** ${announcement.target_type}`
          };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Webhook returned status ${res.status}`);
    }

    return { success: true, message: `Dispatched to ${platform} successfully!` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown webhook error';
    return { success: false, message: msg };
  }
};
