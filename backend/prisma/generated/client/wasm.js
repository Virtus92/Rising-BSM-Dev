
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.RefreshTokenScalarFieldEnum = {
  id: 'id',
  token: 'token',
  expires: 'expires',
  createdAt: 'createdAt',
  createdByIp: 'createdByIp',
  revoked: 'revoked',
  revokedAt: 'revokedAt',
  revokedByIp: 'revokedByIp',
  replacedByToken: 'replacedByToken',
  userId: 'userId'
};

exports.Prisma.ServiceScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  priceBase: 'priceBase',
  vatRate: 'vatRate',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  unit: 'unit'
};

exports.Prisma.InvoicePositionScalarFieldEnum = {
  id: 'id',
  invoiceId: 'invoiceId',
  serviceId: 'serviceId',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RequestNoteScalarFieldEnum = {
  id: 'id',
  requestId: 'requestId',
  userId: 'userId',
  createdAt: 'createdAt',
  userName: 'userName',
  text: 'text'
};

exports.Prisma.AppointmentNoteScalarFieldEnum = {
  id: 'id',
  appointmentId: 'appointmentId',
  userId: 'userId',
  createdAt: 'createdAt',
  userName: 'userName',
  text: 'text'
};

exports.Prisma.CustomerScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  newsletter: 'newsletter',
  name: 'name',
  company: 'company',
  email: 'email',
  phone: 'phone',
  address: 'address',
  postalCode: 'postalCode',
  city: 'city',
  country: 'country',
  notes: 'notes',
  status: 'status',
  type: 'type'
};

exports.Prisma.UserSettingsScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  darkMode: 'darkMode',
  emailNotifications: 'emailNotifications',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  pushNotifications: 'pushNotifications',
  language: 'language',
  notificationInterval: 'notificationInterval'
};

exports.Prisma.ServiceLogScalarFieldEnum = {
  id: 'id',
  serviceId: 'serviceId',
  createdAt: 'createdAt',
  userId: 'userId',
  action: 'action',
  details: 'details',
  userName: 'userName'
};

exports.Prisma.BlogPostScalarFieldEnum = {
  id: 'id',
  authorId: 'authorId',
  publishedAt: 'publishedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  title: 'title',
  slug: 'slug',
  content: 'content',
  excerpt: 'excerpt',
  featuredImage: 'featuredImage',
  status: 'status',
  seoTitle: 'seoTitle',
  seoDescription: 'seoDescription',
  seoKeywords: 'seoKeywords'
};

exports.Prisma.BlogCategoryScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  name: 'name',
  slug: 'slug',
  description: 'description'
};

exports.Prisma.BlogPostCategoryScalarFieldEnum = {
  postId: 'postId',
  categoryId: 'categoryId'
};

exports.Prisma.BlogTagScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  name: 'name',
  slug: 'slug'
};

exports.Prisma.BlogPostTagScalarFieldEnum = {
  postId: 'postId',
  tagId: 'tagId'
};

exports.Prisma.BlogSeoKeywordScalarFieldEnum = {
  id: 'id',
  searchVolume: 'searchVolume',
  currentRanking: 'currentRanking',
  targetPostId: 'targetPostId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  keyword: 'keyword'
};

exports.Prisma.BlogAnalyticsScalarFieldEnum = {
  id: 'id',
  postId: 'postId',
  views: 'views',
  uniqueVisitors: 'uniqueVisitors',
  date: 'date'
};

exports.Prisma.BlogAiRequestScalarFieldEnum = {
  id: 'id',
  resultPostId: 'resultPostId',
  requestedBy: 'requestedBy',
  createdAt: 'createdAt',
  completedAt: 'completedAt',
  status: 'status',
  targetAudience: 'targetAudience',
  tone: 'tone',
  topic: 'topic',
  keywords: 'keywords'
};

exports.Prisma.InvoiceScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  customerId: 'customerId',
  amount: 'amount',
  vatAmount: 'vatAmount',
  totalAmount: 'totalAmount',
  invoiceDate: 'invoiceDate',
  dueDate: 'dueDate',
  paidAt: 'paidAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  status: 'status',
  invoiceNumber: 'invoiceNumber'
};

exports.Prisma.UserSessionScalarFieldEnum = {
  sid: 'sid',
  sess: 'sess',
  expire: 'expire'
};

exports.Prisma.ProjectNoteScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  userId: 'userId',
  createdAt: 'createdAt',
  userName: 'userName',
  text: 'text'
};

exports.Prisma.CustomerLogScalarFieldEnum = {
  id: 'id',
  customerId: 'customerId',
  userId: 'userId',
  createdAt: 'createdAt',
  userName: 'userName',
  action: 'action',
  details: 'details'
};

exports.Prisma.UserActivityScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  timestamp: 'timestamp',
  activity: 'activity',
  ipAddress: 'ipAddress'
};

exports.Prisma.RequestLogScalarFieldEnum = {
  id: 'id',
  requestId: 'requestId',
  userId: 'userId',
  createdAt: 'createdAt',
  details: 'details',
  userName: 'userName',
  action: 'action'
};

exports.Prisma.ProjectScalarFieldEnum = {
  id: 'id',
  customerId: 'customerId',
  serviceId: 'serviceId',
  startDate: 'startDate',
  endDate: 'endDate',
  amount: 'amount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdBy: 'createdBy',
  title: 'title',
  description: 'description',
  status: 'status'
};

exports.Prisma.ProjectLogScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  userId: 'userId',
  userName: 'userName',
  action: 'action',
  details: 'details',
  createdAt: 'createdAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  updatedAt2: 'updatedAt2',
  name: 'name',
  email: 'email',
  password: 'password',
  role: 'role',
  phone: 'phone',
  status: 'status',
  profilePicture: 'profilePicture',
  resetToken: 'resetToken',
  resetTokenExpiry: 'resetTokenExpiry'
};

exports.Prisma.AppointmentScalarFieldEnum = {
  id: 'id',
  customerId: 'customerId',
  projectId: 'projectId',
  appointmentDate: 'appointmentDate',
  duration: 'duration',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdBy: 'createdBy',
  title: 'title',
  location: 'location',
  description: 'description',
  status: 'status'
};

exports.Prisma.ContactRequestScalarFieldEnum = {
  id: 'id',
  processorId: 'processorId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  name: 'name',
  email: 'email',
  phone: 'phone',
  service: 'service',
  message: 'message',
  status: 'status',
  ipAddress: 'ipAddress'
};

exports.Prisma.AppointmentLogScalarFieldEnum = {
  id: 'id',
  appointmentId: 'appointmentId',
  userId: 'userId',
  createdAt: 'createdAt',
  action: 'action',
  details: 'details',
  userName: 'userName'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  referenceId: 'referenceId',
  read: 'read',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  type: 'type',
  title: 'title',
  message: 'message',
  referenceType: 'referenceType',
  description: 'description'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};


exports.Prisma.ModelName = {
  RefreshToken: 'RefreshToken',
  Service: 'Service',
  InvoicePosition: 'InvoicePosition',
  RequestNote: 'RequestNote',
  AppointmentNote: 'AppointmentNote',
  Customer: 'Customer',
  UserSettings: 'UserSettings',
  ServiceLog: 'ServiceLog',
  BlogPost: 'BlogPost',
  BlogCategory: 'BlogCategory',
  BlogPostCategory: 'BlogPostCategory',
  BlogTag: 'BlogTag',
  BlogPostTag: 'BlogPostTag',
  BlogSeoKeyword: 'BlogSeoKeyword',
  BlogAnalytics: 'BlogAnalytics',
  BlogAiRequest: 'BlogAiRequest',
  Invoice: 'Invoice',
  UserSession: 'UserSession',
  ProjectNote: 'ProjectNote',
  CustomerLog: 'CustomerLog',
  UserActivity: 'UserActivity',
  RequestLog: 'RequestLog',
  Project: 'Project',
  ProjectLog: 'ProjectLog',
  User: 'User',
  Appointment: 'Appointment',
  ContactRequest: 'ContactRequest',
  AppointmentLog: 'AppointmentLog',
  Notification: 'Notification'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
