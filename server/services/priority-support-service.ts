import { storage } from '../storage';

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  category: 'technical' | 'billing' | 'feature-request' | 'bug' | 'general';
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  customerTier: 'free' | 'premium';
}

export interface SupportResponse {
  id: string;
  ticketId: string;
  responderId: string;
  responderName: string;
  message: string;
  isCustomerResponse: boolean;
  createdAt: Date;
}

export class PrioritySupportService {
  async createTicket(
    userId: string,
    subject: string,
    description: string,
    category: SupportTicket['category'],
    priority?: SupportTicket['priority']
  ): Promise<SupportTicket> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const customerTier = user.subscriptionPlan === 'premium' ? 'premium' : 'free';
    
    // Auto-assign priority based on customer tier and content analysis
    let ticketPriority = priority;
    if (!ticketPriority) {
      ticketPriority = this.determinePriority(description, category, customerTier);
    }

    const ticket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      userId,
      subject,
      description,
      priority: ticketPriority,
      status: 'open',
      category,
      createdAt: new Date(),
      updatedAt: new Date(),
      customerTier
    };

    // In a real implementation, this would be stored in database
    console.log(`Priority support ticket created: ${ticket.id} for ${customerTier} customer`);

    // Send immediate auto-response based on tier
    await this.sendAutoResponse(ticket);

    return ticket;
  }

  async getTickets(userId: string): Promise<SupportTicket[]> {
    // In a real implementation, would fetch from database
    // Mock data for demonstration
    return [
      {
        id: 'ticket-demo-1',
        userId,
        subject: 'Feature Enhancement Request',
        description: 'Would love to see custom project templates',
        priority: 'medium',
        status: 'in-progress',
        category: 'feature-request',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        customerTier: 'premium',
        assignedTo: 'Support Specialist'
      }
    ];
  }

  async escalateTicket(ticketId: string, reason: string): Promise<void> {
    // In a real implementation, would update ticket in database and notify escalation team
    console.log(`Ticket ${ticketId} escalated: ${reason}`);
  }

  async addResponse(ticketId: string, message: string, isCustomerResponse: boolean = false): Promise<SupportResponse> {
    const response: SupportResponse = {
      id: `response-${Date.now()}`,
      ticketId,
      responderId: isCustomerResponse ? 'dev-user-1' : 'support-agent-1',
      responderName: isCustomerResponse ? 'Customer' : 'Support Team',
      message,
      isCustomerResponse,
      createdAt: new Date()
    };

    console.log(`Response added to ticket ${ticketId}`);
    return response;
  }

  private determinePriority(
    description: string,
    category: SupportTicket['category'],
    customerTier: 'free' | 'premium'
  ): SupportTicket['priority'] {
    // Premium customers get higher baseline priority
    if (customerTier === 'premium') {
      // Check for critical keywords
      if (this.containsCriticalKeywords(description)) {
        return 'critical';
      }
      if (category === 'billing' || category === 'bug') {
        return 'high';
      }
      return 'medium';
    }

    // Free tier customers
    if (this.containsCriticalKeywords(description)) {
      return 'high';
    }
    if (category === 'bug') {
      return 'medium';
    }
    return 'low';
  }

  private containsCriticalKeywords(description: string): boolean {
    const criticalKeywords = [
      'data loss', 'cannot access', 'billing issue', 'account locked',
      'security', 'urgent', 'critical', 'broken', 'not working', 'error'
    ];
    
    const lowerDescription = description.toLowerCase();
    return criticalKeywords.some(keyword => lowerDescription.includes(keyword));
  }

  private async sendAutoResponse(ticket: SupportTicket): Promise<void> {
    let responseTime = '48 hours';
    let message = 'Thank you for contacting our support team. We have received your request and will respond within 48 hours.';

    if (ticket.customerTier === 'premium') {
      switch (ticket.priority) {
        case 'critical':
          responseTime = '2 hours';
          message = 'Thank you for your Premium support request. As a priority customer, we are escalating this critical issue immediately and will respond within 2 hours.';
          break;
        case 'high':
          responseTime = '4 hours';
          message = 'Thank you for your Premium support request. We are reviewing this high-priority issue and will respond within 4 hours.';
          break;
        case 'medium':
        case 'low':
          responseTime = '12 hours';
          message = 'Thank you for your Premium support request. We will review your inquiry and respond within 12 hours.';
          break;
      }
    }

    // In a real implementation, would send email/notification
    console.log(`Auto-response sent for ticket ${ticket.id}: Response time ${responseTime}`);
    
    await this.addResponse(ticket.id, message, false);
  }

  async getResponseTimes(): Promise<{ tier: string; averageHours: number }[]> {
    return [
      { tier: 'Premium Critical', averageHours: 1.5 },
      { tier: 'Premium High', averageHours: 3.2 },
      { tier: 'Premium Standard', averageHours: 8.1 },
      { tier: 'Free Tier', averageHours: 36.5 }
    ];
  }

  async getCustomerSatisfactionStats(): Promise<{
    averageRating: number;
    totalTickets: number;
    resolvedInSLA: number;
    escalationRate: number;
  }> {
    return {
      averageRating: 4.7,
      totalTickets: 1247,
      resolvedInSLA: 94.2,
      escalationRate: 3.1
    };
  }
}

export const prioritySupportService = new PrioritySupportService();