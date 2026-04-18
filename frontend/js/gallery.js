fetch("https://aicyberx-1.onrender.com/api/gallery")
    .then(res => res.json())
    .then(data => console.log(data));