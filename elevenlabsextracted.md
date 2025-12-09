Summary

Ali contacted سقيفة customer service (Khaled) to schedule an electrician for سقيفة 28. The appointment was set for Tuesday at 2 PM, and the phone number 01154 688628 was provided. Ali confirmed the details and thanked Khaled. The call was then ended.

Call status

Successful
User ID

vs_8ccae9a6836fca12

Data collection

preferred_datetime

string
2025-12-16T14:00:00+00:00

The user requested an appointment on "يوم الثلاث الساعة 2 مساء", which translates to Tuesday at 2 PM. Assuming "الثلاث" refers to the next Tuesday from the start time of the conversation (2025-12-09T15:25:37+00:00), the date would be 2025-12-16. Therefore, the normalized ISO 8601 time is 2025-12-16T14:00:00+00:00.

phone

string
01154688628

The user provided the phone number 01154688628 in the conversation: "يوم الثلاث الساعة 2 مساء وعاوز حد ياخذ رقم 01154 688628."

extracted_intent

string
book_appointment

The user is requesting to schedule an appointment for electrical maintenance, which falls under the 'book_appointment' category.

customer_name

string
علي

The user states their name as 'علي' (Ali) in the conversation.

issue

string
مشكلة الكهرباء

تم تحديد أن الغرض هو raise_ticket. بناءً على المحادثة، يمكن استخلاص مشكلة المستخدم كـ 'مشكلة الكهرباء'.

priority

string
high

The user is reporting a problem with electricity, which is urgent. Therefore, the priority should be high.

project

string
سقيفة 28

The user mentions "سقيفة 28" as the location where they need help with electricity. Therefore, I extract "سقيفة 28".



--------------------------------------------------------------------------------------------------------------------------------
Data collection

Add data point

preferred_datetime

If intent is book_appointment, extract the requested date/time in ISO 8601 if explicitly stated (e.g., 2025-09-10T16:00:00+03:00). If relative (غداً العصر)، normalize to a best-guess ISO in Riyadh time if clear; otherwise leave empty.



phone

Extract the caller's phone number from the conversation if stated. Use digits only (e.g., 0501234567 or 9665XXXXXXXX). If not stated, leave empty.



extracted_intent

Classify the user's request for the whole conversation into exactly one of: - raise_ticket (customer has a complaint, issue, or needs support) - book_appointment (customer wants to schedule a visit, viewing, meeting, or confirm an existing one) - none (no actionable request) Output only one of: raise_ticket | book_appointment | none.



customer_name

Extract the caller's name if stated (Arabic preferred). If not stated, leave empty.



issue

If intent is raise_ticket, extract a concise problem statement in Arabic (≤200 chars), e.g., "عطل في التكييف"، "تاخير في الصيانة". Otherwise leave empty.



priority

If intent is raise_ticket, classify priority as one of: low | medium | high based on urgency (مثلاً انقطاع كهرباء = high). Otherwise leave empty.



project

Extract the project or location mentioned (e.g., "سقيفة 28"، "القيروان"، "المعذر"). If none mentioned, leave empty.