export type PlanType = "FREE" | "PREMIUM";

export type ReadingStatus = "QUERO_LER" | "LENDO" | "LIDO";

export type ListingStatus = "ACTIVE" | "NEGOTIATING" | "SOLD" | "CANCELLED";

export type BookCondition = "NEW" | "LIKE_NEW" | "GOOD" | "USED" | "WORN";

export type PurchaseStatus =
  | "PENDING"
  | "PAYMENT_CONFIRMED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export type NotificationType =
  | "READING"
  | "GROUP"
  | "SALE"
  | "PURCHASE"
  | "FAVORITE_LISTING_MATCH";

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  plan_type: PlanType;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  description?: string | null;
  cover_url?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  published_year?: number | null;
}

export interface UserBook {
  id: number;
  user_id: number;
  book_id: number;
  status: ReadingStatus;
  progress_page?: number | null;
  progress_chapter?: number | null;
  progress_percent?: number | null;
  started_at?: string | null;
  finished_at?: string | null;
  rating?: number | null;
  notes?: string | null;
  book: Book;
}

export interface ShelfStats {
  total_books: number;
  quero_ler: number;
  lendo: number;
  lido: number;
  lidos_no_ano: number;
}

export interface Group {
  id: number;
  name: string;
  description?: string | null;
  cover_url?: string | null;
  is_public: boolean;
  created_by_user_id: number;
}

export type GroupRole = "OWNER" | "MODERATOR" | "MEMBER";

export interface GroupDetail extends Group {
  member_count: number;
  my_role: GroupRole | null;
}

export interface MyGroup {
  group: Group;
  role: GroupRole;
  alert_label?: string | null;
}

export interface FreemiumInfo {
  max_groups_free: number;
  groups_used: number;
  can_join_more: boolean;
}

export interface Listing {
  id: number;
  seller_id: number;
  book_id: number;
  user_book_id?: number | null;
  title: string;
  description?: string | null;
  price: number;
  condition: BookCondition;
  status: ListingStatus;
  book: Book;
  group_ids: number[];
}

export interface Purchase {
  id: number;
  listing_id: number;
  buyer_id: number;
  seller_id: number;
  amount: number;
  status: PurchaseStatus;
  delivery_status?: string | null;
  estimated_delivery_at?: string | null;
  completed_at?: string | null;
  listing: Listing;
}

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read_at?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}
