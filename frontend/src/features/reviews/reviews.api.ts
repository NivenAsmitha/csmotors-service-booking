import api from '../../api/axios'
import type { Review } from '../../types/review'

export type CreateReviewPayload = {
  booking_id: string
  rating: number
  comment?: string
}

export async function createReview(payload: CreateReviewPayload) {
  const response = await api.post<Review>('/reviews', payload)
  return response.data
}

export async function getAllReviews() {
  const response = await api.get<Review[]>('/reviews')
  return response.data
}

export async function getEmployeeReviews(employeeId: string) {
  const response = await api.get<Review[]>(`/reviews/employee/${employeeId}`)
  return response.data
}

export async function getMyReviews() {
  const response = await api.get<Review[]>('/reviews/my')
  return response.data
}
