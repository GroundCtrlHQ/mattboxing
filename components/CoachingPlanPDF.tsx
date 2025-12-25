'use client';

import jsPDF from 'jspdf';
import { CoachingResponse, CoachingFormData } from './LeadMagnetCoach';

// 7-Day 30-Minute Training Plan
const SEVEN_DAY_PLAN = [
  { day: 'Day 1', focus: 'Stance & Jab', duration: '30 min', description: 'Master your boxing stance and perfect the jab technique' },
  { day: 'Day 2', focus: 'Footwork & Movement', duration: '30 min', description: 'Develop agility and learn to move in the ring' },
  { day: 'Day 3', focus: 'Defense & Guard', duration: '30 min', description: 'Build your defensive skills and protect yourself' },
  { day: 'Day 4', focus: 'Combinations', duration: '30 min', description: 'Learn basic punch combinations and flow' },
  { day: 'Day 5', focus: 'Power & Cross', duration: '30 min', description: 'Develop power in your rear hand cross' },
  { day: 'Day 6', focus: 'Conditioning', duration: '30 min', description: 'Build endurance and boxing-specific fitness' },
  { day: 'Day 7', focus: 'Review & Sparring Prep', duration: '30 min', description: 'Review all techniques and prepare for live work' },
];

export function generateCoachingPlanPDF(
  parsedResponse: CoachingResponse,
  formData: CoachingFormData
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Helper function to add text with word wrap
  const addText = (
    text: string,
    fontSize: number,
    isBold: boolean = false,
    color: [number, number, number] = [0, 0, 0]
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      if (yPos > pageHeight - margin - 10) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, margin, yPos);
      yPos += fontSize * 0.5;
    });
    yPos += 5;
  };

  // Header
  doc.setFillColor(220, 38, 38); // Boxing red
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('THE BOXING LOCKER', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.text('Personalised Coaching Plan', pageWidth / 2, 32, { align: 'center' });

  yPos = 50;

  // Your Profile Section
  addText('YOUR PROFILE', 16, true, [220, 38, 38]);
  doc.setDrawColor(220, 38, 38);
  doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
  yPos += 5;

  addText(`Experience Level: ${formData.experience}`, 12);
  addText(`Stance: ${formData.stance}`, 12);
  addText(`Training Location: ${formData.location}`, 12);
  addText(`Time Available: ${formData.timeAvailable}`, 12);
  yPos += 5;

  // 7-Day Plan Section
  addText('7-DAY TRAINING PLAN', 16, true, [220, 38, 38]);
  doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
  yPos += 5;

  SEVEN_DAY_PLAN.forEach((day) => {
    if (yPos > pageHeight - margin - 20) {
      doc.addPage();
      yPos = margin;
    }
    addText(`${day.day}: ${day.focus}`, 12, true);
    addText(`Duration: ${day.duration} | ${day.description}`, 10, false, [100, 100, 100]);
    yPos += 3;
  });
  yPos += 5;

  // Coaching Plan Section
  addText('PERSONALISED COACHING PLAN', 16, true, [220, 38, 38]);
  doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
  yPos += 5;

  // Clean up markdown and format text
  const cleanResponse = parsedResponse.response
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
    .replace(/#{1,6}\s/g, '') // Remove headers
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`(.*?)`/g, '$1'); // Remove inline code

  addText(cleanResponse, 11);
  yPos += 5;

  // Video Recommendations
  if (parsedResponse.video_recommendations && parsedResponse.video_recommendations.length > 0) {
    if (yPos > pageHeight - margin - 30) {
      doc.addPage();
      yPos = margin;
    }
    addText('RECOMMENDED VIDEOS', 16, true, [220, 38, 38]);
    doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
    yPos += 5;

    parsedResponse.video_recommendations.forEach((video, index) => {
      if (yPos > pageHeight - margin - 20) {
        doc.addPage();
        yPos = margin;
      }
      addText(`${index + 1}. ${video.title}`, 12, true);
      if (video.reason) {
        addText(video.reason, 10, false, [100, 100, 100]);
      }
      yPos += 3;
    });
    yPos += 5;
  }

  // Cardio Section
  if (yPos > pageHeight - margin - 40) {
    doc.addPage();
    yPos = margin;
  }
  addText('WHY CARDIO MATTERS IN BOXING', 16, true, [220, 38, 38]);
  doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
  yPos += 5;

  const cardioText = `Cardio isn't just about running longer—it's about lasting in the ring. Boxing demands explosive bursts of energy followed by quick recovery. Your cardiovascular fitness directly impacts your ability to maintain power and speed throughout rounds, recover quickly between combinations, keep your guard up when you're tired, think clearly under pressure, and execute techniques correctly when fatigued.

Even 15-20 minutes of focused cardio work 3-4 times per week will dramatically improve your boxing performance. Mix running, skipping, and bag work to build that engine.`;

  addText(cardioText, 11);
  yPos += 5;

  // Footer
  const footerY = pageHeight - 20;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Generated by The Boxing Locker', pageWidth / 2, footerY, { align: 'center' });
  doc.text('Visit: www.tbltrainingplans.com', pageWidth / 2, footerY + 8, { align: 'center' });

  // Save PDF
  doc.save(`boxing-coaching-plan-${new Date().toISOString().split('T')[0]}.pdf`);
}

