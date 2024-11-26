import jsPDF from 'jspdf';

const doc = new jsPDF();
doc.addFont("./font/kaiu.ttf", "kaiu", "normal");
doc.setFont("kaiu"); // 設置為標楷體

doc.text("表單內容", 10, 10);
doc.text(`姓名: ${data.name}`, 10, 20);
doc.text(`年齡: ${data.age}`, 10, 30);
doc.text(`電話: ${data.phone}`, 10, 40);
doc.save("form.pdf");