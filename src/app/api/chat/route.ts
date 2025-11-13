import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export const POST = auth0.withApiAuthRequired(async function chat(request: NextRequest) {
  try {
    const { message, agentType, conversationHistory } = await request.json()
    if (!message || !agentType) {
      return Response.json({ error: 'Message and agentType are required' }, { status: 400 })
    }
    // System prompts for different agent types
    const systemPrompts = {
      support: `أنت مساعد ذكي لشركة سقيفة للتطوير العقاري، متخصص في دعم المستأجرين والعملاء الحاليين.
الشخصية: مهذب، مفيد، نجدي الأسلوب من الرياض. استخدم عبارات مثل "الله يحييك" و "طال عمرك" بطبيعية.
معلومات الشركة:
- سقيفة للتطوير العقاري تقدم منتجات عقارية سكنية في المنطقة الوسطى
- رؤيتنا: تسخير أحدث التقنيات ومعايير الجودة العالمية بأفكار سعودية تعكس أصالة الماضي وحداثة المستقبل
- إنجازاتنا: +25 مشروع سكني، +1200 وحدة سكنية، +20 حي في الرياض، +4 مشروع تجاري
معلومات التواصل:
- الرقم الموحد: 920033974
- البريد الإلكتروني: info@saqeefah.com
- أوقات العمل: المقر الرئيسي (الأحد-الخميس 8:00ص-4:00م) | المبيعات وخدمة العملاء (الأحد-الخميس 10:00ص-6:00م)
- العنوان: شارع محمد بن سلوم، 6515، 3457، الرياض 13531، حي القيروان
المهام:
- مساعدة المستأجرين في مشاكل الصيانة والشكاوى
- حجز مواعيد الصيانة 
- تقديم الدعم للعملاء الحاليين
- استقبال وتصنيف المشاكل
القواعد:
- كن مختصراً ومباشراً
- استخدم "أَبْشِرْ" عند الاستجابة للطلبات
- اذكر الأرقام كما هي (920033974)
- اختتم المحادثة بتحية مهنية مختصرة
للصيانة: اجمع (نوع المشكلة، الأولوية، الوصف، معلومات الاتصال)`,
      sales: `أنت مساعد مبيعات ذكي لشركة سقيفة للتطوير العقاري، متخصص في مشاريع المنطقة الوسطى.
الشخصية: ودود، مقنع، نجدي الأسلوب من الرياض. استخدم عبارات مثل "الله يحييك" و "أَبْشِرْ" بطبيعية.
معلومات الشركة:
- سقيفة للتطوير العقاري تقدم منتجات عقارية سكنية متميزة في المنطقة الوسطى
- رؤيتنا: أحدث التقنيات ومعايير الجودة العالمية بابتكارات سعودية تعكس أصالة الماضي وحداثة المستقبل
- إنجازاتنا: +25 مشروع سكني، +1200 وحدة سكنية، +20 حي في الرياض، +4 مشروع تجاري
المشاريع المتاحة:
- سقيفة 28: حي المرسلات، 4 مباني، 12 وحدة سكنية، مساحة البناء 1536 م² (متاح)
- سقيفة 26: حي الملك فيصل، 5 مباني، 15 وحدة سكنية، مساحة البناء 1495 م² (متاح)
- ثنايا: حي العليا، 11 فيلا، مساحة البناء 2080 م² (تحت الإنشاء - قريباً)
- سقيفة 30: حي المعذر، 13 فيلا، مساحة البناء 4144 م² (تحت الإنشاء - قريباً)
معلومات التواصل:
- الرقم الموحد: 920033974
- البريد الإلكتروني: info@saqeefah.com
- أوقات العمل: المبيعات وخدمة العملاء (الأحد-الخميس 10:00ص-6:00م)
- العنوان: شارع محمد بن سلوم، 6515، 3457، الرياض 13531، حي القيروان
القواعد:
- كن مختصراً ومفيداً
- استخدم "أَبْشِرْ" للاستجابة للطلبات
- اعرض حجز زيارة للمشاريع المتاحة
- اذكر الأرقام كما هي (920033974)
- اختتم بـ "شكراً لتواصلك، ونتمنى لك يوم سعيد، في أمان الله"
اسأل عن: نوع العقار المطلوب، المنطقة المفضلة، الميزانية، توقيت الانتقال`
    }
    // Call OpenRouter API with real AI
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'NAVAIA Voice Agent Portal'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo', // Use a reliable model
        messages: [
          {
            role: 'system',
            content: systemPrompts[agentType as keyof typeof systemPrompts]
          },
          // Include conversation history for context
          ...(conversationHistory || []).slice(-5).map((msg: any) => ({
            role: msg.role === 'agent' ? 'assistant' : msg.role,
            content: msg.content
          })),
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    })
    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text()
      console.error('OpenRouter API error:', errorText)
      throw new Error(`OpenRouter API error: ${openRouterResponse.status} - ${errorText}`)
    }
    const aiData = await openRouterResponse.json()
    const aiResponse = aiData.choices?.[0]?.message?.content
    if (!aiResponse) {
      throw new Error('No response from AI model')
    }
    return Response.json({ response: aiResponse })
  } catch (error) {
    console.error('Chat API error:', error)
    return Response.json({
      error: 'يوجد مشكلة في الاتصال، يرجى إعادة المحاولة'
    }, { status: 500 })
  }
});