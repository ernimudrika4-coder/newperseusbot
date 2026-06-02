async function testCron() {
  try {
    const res = await fetch("http://127.0.0.1:3000/api/cron?chatId=6736752233");
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testCron();
