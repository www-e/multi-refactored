import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import ActionMenu from '../ui/ActionMenu';
import { formatDate, formatSAR } from '@/lib/utils';
import { mapBookingStatusToArabic, mapTicketStatusToArabic, mapCampaignStatusToArabic, mapCallStatusToArabic } from '@/lib/statusMapper';
import { User, Phone, Mail, MapPin, Calendar, BarChart3, MoreVertical, Edit, Trash2, PhoneCall, Check, X } from 'lucide-react';

interface BaseItem {
  id: string;
  createdAt?: string;
}

interface Customer extends BaseItem {
  type: 'customer';
  name: string;
  phone: string;
  email?: string;
  neighborhoods?: string[];
  stage?: string;
  stats?: {
    tickets: number;
    bookings: number;
    calls: number;
  };
}

interface Booking extends BaseItem {
  type: 'booking';
  customerName?: string;
  customerId?: string;
  project?: string;
  propertyId?: string;
  startDate: string;
  price?: number;
  source?: string;
  status: string;
}

interface Ticket extends BaseItem {
  type: 'ticket';
  customerId?: string;
  customerName?: string;
  issue: string;
  category?: string;
  priority?: string;
  status: string;
  project?: string;
}

interface Campaign extends BaseItem {
  type: 'campaign';
  name: string;
  status: string;
  campaignType: string; // Renamed to avoid conflict with the type field
  objective?: string;
  attribution?: string;
  audienceQuery?: string | object;
  metrics?: {
    reached: number;
    roas: number;
  };
}

type Item = Customer | Booking | Ticket | Campaign;

interface ResponsiveTableCardProps {
  item: Item;
  actions: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    color?: string;
    disabled?: boolean;
  }>;
  onCardClick?: (item: Item) => void;
  customers?: any[]; // For resolving customer names
  properties?: any[]; // For resolving property names
  customActionButtons?: React.ReactNode; // For special action buttons like campaign status toggle
}

const ResponsiveTableCard: React.FC<ResponsiveTableCardProps> = ({
  item,
  actions,
  onCardClick,
  customers = [],
  properties = [],
  customActionButtons
}) => {
  const getCustomerName = (itemId: string, customerName?: string, customerId?: string) => {
    if (customerName && customerName !== 'Unknown') return customerName;
    if (customerId) {
      const customer = customers.find(c => c.id === customerId);
      return customer ? customer.name : 'Unknown';
    }
    return 'Unknown';
  };

  const getPropertyDisplay = (propertyId?: string, project?: string) => {
    if (project && project !== 'GENERAL-INQUIRY') return project;
    if (propertyId) {
      const property = properties.find(p => p.id === propertyId);
      if (property) return property.code;
    }
    return propertyId || 'General';
  };

  const renderCardContent = () => {
    switch (item.type) {
      case 'customer':
        const customer = item as Customer;
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <User className="w-4 h-4 text-slate-400 ml-2" />
                <span className="font-medium">{customer.name}</span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">#{item.id.substring(0, 8)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" />
                  <span className="text-slate-500 dark:text-slate-400">الهاتف:</span>
                </div>
                <p className="text-slate-900 dark:text-slate-100">{customer.phone}</p>
              </div>
              
              {customer.email && (
                <div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400">البريد:</span>
                  </div>
                  <p className="text-slate-900 dark:text-slate-100">{customer.email}</p>
                </div>
              )}
              
              {customer.neighborhoods?.[0] && (
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400">المنطقة:</span>
                  </div>
                  <p className="text-slate-900 dark:text-slate-100">{customer.neighborhoods[0]}</p>
                </div>
              )}
              
              <div>
                <span className="text-slate-500 dark:text-slate-400">الحالة:</span>
                <div className="mt-1"><StatusBadge status={customer.stage as any || 'جديد'} /></div>
              </div>
            </div>

            {customer.stats && (
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{customer.stats.calls}</div>
                  <div className="text-xs text-slate-500">المحادثات</div>
                </div>
                <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{customer.stats.tickets}</div>
                  <div className="text-xs text-slate-500">التذاكر</div>
                </div>
                <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{customer.stats.bookings}</div>
                  <div className="text-xs text-slate-500">الحجوزات</div>
                </div>
              </div>
            )}
            
            {item.createdAt && (
              <div className="text-sm">
                <span className="text-slate-500 dark:text-slate-400">تاريخ الإنشاء:</span>
                <p className="text-slate-900 dark:text-slate-100">{formatDate(item.createdAt)}</p>
              </div>
            )}
          </div>
        );

      case 'booking':
        const booking = item as Booking;
        const customerName = getCustomerName(item.id, booking.customerName, booking.customerId);
        const propertyDisplay = getPropertyDisplay(booking.propertyId, booking.project);
        
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <User className="w-4 h-4 text-slate-400 ml-2" />
                <span className="font-medium">{customerName}</span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">#{item.id.substring(0, 8)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">العقار/المشروع:</span>
                <p className="text-slate-900 dark:text-slate-100">{propertyDisplay}</p>
              </div>
              
              <div>
                <span className="text-slate-500 dark:text-slate-400">موعد الحجز:</span>
                <p className="text-slate-900 dark:text-slate-100">{formatDate(booking.startDate)}</p>
              </div>
              
              <div>
                <span className="text-slate-500 dark:text-slate-400">تاريخ الإنشاء:</span>
                <p className="text-slate-900 dark:text-slate-100">{formatDate(booking.createdAt || '')}</p>
              </div>
              
              <div>
                <span className="text-slate-500 dark:text-slate-400">السعر:</span>
                <p className="font-semibold text-primary">{formatSAR(booking.price || 0)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">المصدر:</span>
                <div className="mt-1"><StatusBadge status={booking.source as any || ''} type="icon" /></div>
              </div>
              
              <div>
                <span className="text-slate-500 dark:text-slate-400">الحالة:</span>
                <div className="mt-1"><StatusBadge status={booking.status as any} /></div>
              </div>
            </div>
          </div>
        );

      case 'ticket':
        const ticket = item as Ticket;
        const ticketCustomerName = getCustomerName(item.id, ticket.customerName, ticket.customerId);
        
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <User className="w-4 h-4 text-slate-400 ml-2" />
                <span className="font-medium">{ticketCustomerName}</span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">#{item.id.substring(0, 8)}</span>
            </div>

            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">المشكلة:</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                {ticket.issue}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">الفئة:</span>
                <p className="text-slate-900 dark:text-slate-100">{ticket.category || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">الأولوية:</span>
                <div className="mt-1"><StatusBadge status={ticket.priority as any || ''} /></div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">المشروع:</span>
                <p className="text-slate-900 dark:text-slate-100">{ticket.project || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">التاريخ:</span>
                <p className="text-slate-900 dark:text-slate-100">{formatDate(ticket.createdAt || '')}</p>
              </div>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400">الحالة:</span>
              <div className="mt-1"><StatusBadge status={ticket.status as any} /></div>
            </div>
          </div>
        );

      case 'campaign':
        const campaign = item as Campaign;
        
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{campaign.campaignType === 'voice' || campaign.campaignType === 'صوتية' ? '📞' : '💬'}</span>
                <StatusBadge status={campaign.status as any} />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">#{item.id.substring(0, 8)}</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold">{campaign.name}</h3>
              <div className="flex gap-2 flex-wrap">
                {campaign.objective && <StatusBadge status={campaign.objective as any} />}
                {campaign.attribution && <StatusBadge status={campaign.attribution as any} />}
              </div>
              <p className="text-sm text-slate-500 line-clamp-2">
                {typeof campaign.audienceQuery === 'string' ? campaign.audienceQuery : JSON.stringify(campaign.audienceQuery)}
              </p>
            </div>

            {campaign.metrics && (
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-sm font-bold">{campaign.metrics.reached}</div>
                  <div className="text-xs text-slate-500">تم الوصول</div>
                </div>
                <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-sm font-bold text-primary">{campaign.metrics.roas}x</div>
                  <div className="text-xs text-slate-500">ROAS</div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <div>Unsupported item type</div>;
    }
  };

  return (
    <Card 
      className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
      onClick={() => onCardClick && onCardClick(item)}
    >
      {renderCardContent()}
      
      <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
        {customActionButtons ? (
          <div className="flex gap-1">
            {customActionButtons}
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <div>
              {item.type !== 'campaign' && (
                <StatusBadge status={
                  item.type === 'customer' ? (item as Customer).stage as any || 'default' :
                  item.type === 'booking' ? (item as Booking).status as any :
                  item.type === 'ticket' ? (item as Ticket).status as any :
                  'default'
                } />
              )}
            </div>
            <ActionMenu
              position="left"
              actions={actions}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default ResponsiveTableCard;