/**
 * Mailgun Email Service for User Invitations
 * Handles sending invitation emails using Mailgun API
 */

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface InvitationEmailData {
  recipientEmail: string
  recipientName?: string
  companyName: string
  inviterName: string
  inviterEmail: string
  invitationToken: string
  invitationUrl: string
  role: string
}

export class MailgunService {
  private static readonly API_KEY = '9719b533d9e3a17138a158c9515a9059-3c134029-e935ac20'
  private static readonly DOMAIN = 'sandbox5d23280595fa4a9f81cd0cbc8c926e4c.mailgun.org'
  private static readonly BASE_URL = 'https://api.mailgun.net/v3'
  private static readonly FROM_EMAIL = `noreply@${MailgunService.DOMAIN}`

  /**
   * Send invitation email
   */
  static async sendInvitationEmail(data: InvitationEmailData): Promise<boolean> {
    try {
      const template = this.generateInvitationTemplate(data)
      
      const formData = new FormData()
      formData.append('from', `Uproom <${this.FROM_EMAIL}>`)
      formData.append('to', data.recipientEmail)
      formData.append('subject', template.subject)
      formData.append('html', template.html)
      formData.append('text', template.text)

      const response = await fetch(`${this.BASE_URL}/${this.DOMAIN}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${this.API_KEY}`)}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Mailgun API error:', errorText)
        return false
      }

      const result = await response.json()
      console.log('Email sent successfully:', result.id)
      return true

    } catch (error) {
      console.error('Error sending invitation email:', error)
      return false
    }
  }

  /**
   * Generate invitation email template
   */
  private static generateInvitationTemplate(data: InvitationEmailData): EmailTemplate {
    const subject = `You're invited to join ${data.companyName} on Uproom`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to ${data.companyName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px 20px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6b7280; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
          .button:hover { background: #1d4ed8; }
          .role-badge { background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You're Invited!</h1>
            <p>Join ${data.companyName} on Uproom</p>
          </div>
          
          <div class="content">
            <p>Hi${data.recipientName ? ` ${data.recipientName}` : ''},</p>
            
            <p><strong>${data.inviterName}</strong> (${data.inviterEmail}) has invited you to join <strong>${data.companyName}</strong> on Uproom as a <span class="role-badge">${data.role}</span>.</p>
            
            <p>Uproom is a mindful communication platform that helps teams communicate with context, not just text. Our intelligent status system creates shared understanding of your team's availability.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.invitationUrl}" class="button">Accept Invitation</a>
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Click the button above to accept your invitation</li>
              <li>Create your account or sign in if you already have one</li>
              <li>Start collaborating with your team on Uproom</li>
            </ul>
            
            <p>This invitation will expire in 7 days. If you have any questions, feel free to reach out to ${data.inviterName} at ${data.inviterEmail}.</p>
            
            <p>Welcome to better team communication!</p>
          </div>
          
          <div class="footer">
            <p>This invitation was sent by ${data.companyName} via Uproom</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
You're invited to join ${data.companyName} on Uproom!

Hi${data.recipientName ? ` ${data.recipientName}` : ''},

${data.inviterName} (${data.inviterEmail}) has invited you to join ${data.companyName} on Uproom as a ${data.role}.

Uproom is a mindful communication platform that helps teams communicate with context, not just text.

To accept your invitation, visit: ${data.invitationUrl}

What happens next:
- Click the link above to accept your invitation
- Create your account or sign in if you already have one  
- Start collaborating with your team on Uproom

This invitation will expire in 7 days. If you have any questions, reach out to ${data.inviterName} at ${data.inviterEmail}.

Welcome to better team communication!

---
This invitation was sent by ${data.companyName} via Uproom.
If you didn't expect this invitation, you can safely ignore this email.
    `

    return { subject, html, text }
  }

  /**
   * Test email connectivity
   */
  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/${this.DOMAIN}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`api:${this.API_KEY}`)}`
        }
      })

      return response.ok
    } catch (error) {
      console.error('Mailgun connection test failed:', error)
      return false
    }
  }

  /**
   * Send test email
   */
  static async sendTestEmail(toEmail: string): Promise<boolean> {
    try {
      const formData = new FormData()
      formData.append('from', `Uproom Test <${this.FROM_EMAIL}>`)
      formData.append('to', toEmail)
      formData.append('subject', 'Uproom Email Service Test')
      formData.append('text', 'This is a test email from Uproom. If you received this, the email service is working correctly!')

      const response = await fetch(`${this.BASE_URL}/${this.DOMAIN}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${this.API_KEY}`)}`
        },
        body: formData
      })

      return response.ok
    } catch (error) {
      console.error('Test email failed:', error)
      return false
    }
  }
}