import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Fetch from the backend API
    const response = await fetch('http://127.0.0.1:8000/bookings')
    if (!response.ok) {
      throw new Error('Failed to fetch bookings from backend')
    }
    const bookings = await response.json()
    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    // Fallback to empty array if backend is not available
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // إنشاء حجز جديد
    const newBooking = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString()
    }
    
    console.log('تم إنشاء حجز جديد:', newBooking)
    
    return NextResponse.json(newBooking, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'خطأ في معالجة الطلب' },
      { status: 400 }
    )
  }
} 