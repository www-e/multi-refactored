import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // محاكاة إنشاء عقار جديد
    const newProperty = {
      id: Date.now().toString(),
      code: body.code,
      city: body.city || 'الرياض',
      neighborhood: body.neighborhood,
      rooms: body.rooms,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      furnished: body.furnished || false,
      monthlyPriceSAR: body.monthlyPriceSAR,
      yearlyPriceSAR: body.yearlyPriceSAR,
      images: body.images || [],
      availability: body.availability || 'متاح',
      createdAt: new Date().toISOString()
    }
    
    // محاكاة تأخير في المعالجة
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    
    return NextResponse.json({
      success: true,
      property: newProperty,
      message: 'تم إنشاء العقار بنجاح'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'خطأ في إنشاء العقار' 
      },
      { status: 400 }
    )
  }
} 