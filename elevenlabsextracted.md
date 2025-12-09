Summary

Omar contacted support to schedule an electrician for سقيفة 28. The agent, Khaled, scheduled the appointment for Monday at 5 PM. Omar requested to save his phone number, but the agent stated that this was not possible. The agent provided the support number and ended the call.

Call status

Successful
User ID

vs_a045374bdab2cecf

Data collection

preferred_datetime

string
2025-12-15T17:00:00+03:00

The user requested an appointment on "يوم الاثنين الساعة 5 مساء", which translates to Monday at 5 PM. Normalizing this to ISO 8601 in Riyadh time, assuming the conversation is happening on 2025-12-09, the date would be 2025-12-15T17:00:00+03:00.

phone

string
966596387293

The user provided their phone number as 'تسعة ستة ستة خمسة تسعة ستة ثلاثة ثمانية سبعة اثنين تسعة ثلاثة' which translates to 966596387293. I have extracted this number.

extracted_intent

string
book_appointment

The user initially reported an electrical problem and requested someone to fix it. The agent then scheduled an appointment for maintenance. Therefore, the user's request falls under the 'book_appointment' category.

customer_name

string
عمر

The user states his name as 'عمر' in the second turn of the conversation: 'أهلاً بكم يا خالد. اسمي عمر وعندي مشكلة في الكهرباء في سقيفة 28 وعايز حد يجي يحلها لي.'

issue

string
مشكلة في الكهرباء

المحادثة تدور حول مشكلة في الكهرباء وطلب حجز موعد للصيانة. بناء على ذلك، يمكن استخلاص وصف موجز للمشكلة وهو "مشكلة في الكهرباء".

priority

string
high

The user reported a problem with electricity, which is considered urgent. Therefore, the priority should be high.

project

string
سقيفة 28

The user mentions "سقيفة 28" as the location where he has a problem with electricity. The agent also confirms this location.



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