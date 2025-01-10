// src/api.js

export async function submitSignature(data) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/signature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data })
  });
  
  if (response.ok) {
    const result = await response.json();
    return result;
  } else {
    throw new Error('Error creating signature');
  }
}
