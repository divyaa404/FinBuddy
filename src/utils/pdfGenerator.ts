import { jsPDF } from 'jspdf';
import type { Transaction, Budget, SavingsGoal } from '../types';

// Helper: Convert url to Base64 image data URL
const getBase64Image = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } else {
          resolve('');
        }
      } catch (e) {
        resolve('');
      }
    };
    img.onerror = () => {
      resolve('');
    };
  });
};

export const downloadStatementPDF = async (
  user: any,
  transactions: Transaction[],
  budgets: Budget[],
  goals: SavingsGoal[],
  balance: number
) => {
  // Try loading website logo image
  const logoBase64 = await getBase64Image('/logo.png');

  const docInstance = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Color Palette
  const primaryColor = [0, 110, 42]; // #006e2a (Deep Green)
  const textColor = [27, 28, 28]; // #1b1c1c (Dark Grey)
  const mutedTextColor = [100, 100, 100];

  // Helper: Header
  const drawHeader = () => {
    // Top Accent Bar
    docInstance.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    docInstance.rect(0, 0, 210, 10, 'F');
  };

  // Helper: Footer
  const drawFooter = () => {
    docInstance.setFillColor(27, 28, 28);
    docInstance.rect(0, 285, 210, 12, 'F');
    docInstance.setTextColor(255, 255, 255);
    docInstance.setFont('Helvetica', 'normal');
    docInstance.setFontSize(7);
    docInstance.text('© FinBuddy Ledger | All Records Personal and Local', 12, 292.5);
    docInstance.text('Generated via FinBuddy AI Engine', 198, 292.5, { align: 'right' });
  };

  drawHeader();

  // Draw Logo (Website logo.png image or vector fallback)
  if (logoBase64) {
    try {
      docInstance.addImage(logoBase64, 'PNG', 12, 16, 7, 7);
    } catch (e) {
      docInstance.setFillColor(0, 110, 42);
      docInstance.roundedRect(12, 16, 7, 7, 1.5, 1.5, 'F');
      docInstance.setTextColor(255, 255, 255);
      docInstance.setFont('Helvetica', 'bold');
      docInstance.setFontSize(5);
      docInstance.text('F', 14.5, 21);
    }
  } else {
    docInstance.setFillColor(0, 110, 42);
    docInstance.roundedRect(12, 16, 7, 7, 1.5, 1.5, 'F');
    docInstance.setTextColor(255, 255, 255);
    docInstance.setFont('Helvetica', 'bold');
    docInstance.setFontSize(5);
    docInstance.text('F', 14.5, 21);
  }

  // Logo Text
  docInstance.setTextColor(27, 28, 28);
  docInstance.setFont('Helvetica', 'bold');
  docInstance.setFontSize(10.5);
  docInstance.text('FinBuddy', 21, 21.2);

  // Document Title
  docInstance.setFont('Helvetica', 'normal');
  docInstance.setFontSize(8);
  docInstance.setTextColor(100, 100, 100);
  docInstance.text('STUDENT LEDGER REPORT', 198, 21.2, { align: 'right' });

  // Student Profile Card (Left)
  docInstance.setDrawColor(220, 220, 220);
  docInstance.setFillColor(251, 249, 248);
  docInstance.roundedRect(12, 26, 90, 24, 2, 2, 'FD');

  docInstance.setTextColor(textColor[0], textColor[1], textColor[2]);
  docInstance.setFont('Helvetica', 'bold');
  docInstance.setFontSize(8);
  docInstance.text('STUDENT PROFILE', 16, 31.5);

  docInstance.setFont('Helvetica', 'normal');
  docInstance.setFontSize(7.5);
  docInstance.text(`Name:  ${user.displayName || 'Guest User'}`, 16, 36.5);
  docInstance.text(`Email: ${user.email || 'N/A'}`, 16, 41.5);
  docInstance.text(`Type:  Student Demo Account`, 16, 46.5);

  // Summary Metrics (Right)
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsRate = totalIncome > 0 
    ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) 
    : 0;

  const drawMetricCard = (x: number, y: number, w: number, h: number, label: string, val: string, color: number[]) => {
    docInstance.setFillColor(251, 249, 248);
    docInstance.setDrawColor(225, 225, 225);
    docInstance.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');

    docInstance.setFont('Helvetica', 'normal');
    docInstance.setFontSize(6.2);
    docInstance.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    docInstance.text(label, x + 3, y + 3.8);

    docInstance.setFont('Helvetica', 'bold');
    docInstance.setFontSize(8.5);
    docInstance.setTextColor(color[0], color[1], color[2]);
    docInstance.text(val, x + 3, y + 8.8);
  };

  drawMetricCard(108, 26, 43, 11, 'ACCOUNT BALANCE', `INR ${balance.toLocaleString()}`, primaryColor);
  drawMetricCard(155, 26, 43, 11, 'SAVINGS RATE', `${savingsRate}%`, [0, 100, 200]);
  drawMetricCard(108, 39, 43, 11, 'TOTAL INCOME', `INR ${totalIncome.toLocaleString()}`, [0, 120, 50]);
  drawMetricCard(155, 39, 43, 11, 'TOTAL EXPENSES', `INR ${totalExpense.toLocaleString()}`, [180, 20, 20]);

  // Horizontal Divider Line
  docInstance.setDrawColor(230, 230, 230);
  docInstance.line(12, 54, 198, 54);

  // ==========================================
  // LEFT COLUMN: Ledger, Category Bar Chart
  // ==========================================
  
  // 1. Transaction Ledger
  docInstance.setTextColor(textColor[0], textColor[1], textColor[2]);
  docInstance.setFont('Helvetica', 'bold');
  docInstance.setFontSize(9);
  docInstance.text('1. TRANSACTION LEDGER', 12, 60);

  let startY = 64;
  docInstance.setFillColor(238, 242, 238);
  docInstance.rect(12, startY, 90, 5.5, 'F');
  docInstance.setFont('Helvetica', 'bold');
  docInstance.setFontSize(7);
  docInstance.setTextColor(50, 60, 50);
  docInstance.text('DATE', 14, startY + 3.8);
  docInstance.text('CATEGORY', 30, startY + 3.8);
  docInstance.text('NOTE / DESC', 52, startY + 3.8);
  docInstance.text('AMOUNT', 100, startY + 3.8, { align: 'right' });

  docInstance.setFont('Helvetica', 'normal');
  docInstance.setTextColor(textColor[0], textColor[1], textColor[2]);
  let txY = startY + 5.5;

  const displayTx = transactions.slice(0, 18);
  displayTx.forEach((tx, idx) => {
    if (idx % 2 === 1) {
      docInstance.setFillColor(251, 249, 248);
      docInstance.rect(12, txY, 90, 5.5, 'F');
    }

    docInstance.setFontSize(7);
    docInstance.text(tx.date, 14, txY + 3.8);
    docInstance.text(tx.category, 30, txY + 3.8);
    
    let note = tx.note || 'N/A';
    if (note.length > 20) note = note.slice(0, 18) + '..';
    docInstance.text(note, 52, txY + 3.8);

    docInstance.setFont('Helvetica', 'bold');
    if (tx.type === 'expense') {
      docInstance.setTextColor(180, 20, 20);
      docInstance.text(`-INR ${tx.amount.toLocaleString()}`, 100, txY + 3.8, { align: 'right' });
    } else {
      docInstance.setTextColor(0, 120, 50);
      docInstance.text(`+INR ${tx.amount.toLocaleString()}`, 100, txY + 3.8, { align: 'right' });
    }
    docInstance.setTextColor(textColor[0], textColor[1], textColor[2]);
    docInstance.setFont('Helvetica', 'normal');

    txY += 5.5;
  });

  // 2. Vertical Category Expense Bar Graph
  let barChartSectionY = 174;
  docInstance.setTextColor(textColor[0], textColor[1], textColor[2]);
  docInstance.setFont('Helvetica', 'bold');
  docInstance.setFontSize(9);
  docInstance.text('2. VISUAL EXPENSE BREAKDOWN', 12, barChartSectionY);

  let chartBottom = barChartSectionY + 32;
  let chartHeight = 24;
  let chartLeft = 24;
  let chartWidth = 72;

  // Calculate expenses for categories
  const categoryExpensesLeft: { [key: string]: number } = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryExpensesLeft[t.category] = (categoryExpensesLeft[t.category] || 0) + t.amount;
    });

  const sortedCategoriesLeft = Object.entries(categoryExpensesLeft)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Show top 5 categories

  const maxValLeft = Math.max(...sortedCategoriesLeft.map(c => c[1]), 1000);

  // Draw Y-axis line
  docInstance.setDrawColor(200, 200, 200);
  docInstance.setLineWidth(0.3);
  docInstance.line(chartLeft, chartBottom, chartLeft, chartBottom - chartHeight);
  // Draw X-axis line
  docInstance.line(chartLeft, chartBottom, chartLeft + chartWidth, chartBottom);

  // Draw Y Axis Labels & Grid lines
  docInstance.setDrawColor(240, 240, 240);
  docInstance.setLineWidth(0.2);
  const gridTicks = [0, maxValLeft / 2, maxValLeft];
  gridTicks.forEach((tickVal) => {
    const tickY = chartBottom - (tickVal / maxValLeft) * chartHeight;
    docInstance.line(chartLeft, tickY, chartLeft + chartWidth, tickY);
    
    docInstance.setFontSize(5.5);
    docInstance.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    docInstance.text(`INR ${Math.round(tickVal).toLocaleString()}`, chartLeft - 2, tickY + 1.2, { align: 'right' });
  });

  // Draw bars
  const displayBarsCount = sortedCategoriesLeft.length;
  const barWidth = 7;
  const barSpacing = (chartWidth - 6 - (displayBarsCount * barWidth)) / (displayBarsCount - 1 || 1);

  sortedCategoriesLeft.forEach(([cat, amt], idx) => {
    const x = chartLeft + 3 + idx * (barWidth + barSpacing);
    const h = (amt / maxValLeft) * chartHeight;
    const y = chartBottom - h;

    if (h > 0) {
      docInstance.setFillColor(0, 110, 42); // Primary Green
      docInstance.roundedRect(x, y, barWidth, h, 0.6, 0.6, 'F');
    }

    docInstance.setFontSize(5.5);
    docInstance.setTextColor(textColor[0], textColor[1], textColor[2]);
    let label = cat;
    if (label.length > 7) label = label.slice(0, 6) + '.';
    docInstance.text(label, x + barWidth / 2, chartBottom + 3.2, { align: 'center' });

    docInstance.setFont('Helvetica', 'bold');
    docInstance.setFontSize(5);
    docInstance.setTextColor(0, 110, 42);
    docInstance.text(`INR ${Math.round(amt)}`, x + barWidth / 2, y - 1, { align: 'center' });
    docInstance.setFont('Helvetica', 'normal');
  });

  // ==========================================
  // RIGHT COLUMN: Budgets, Goals Achievements, AI Analytics, Balance Trend
  // ==========================================
  
  // 3. Budgets (Numbered as 3)
  docInstance.setTextColor(textColor[0], textColor[1], textColor[2]);
  docInstance.setFont('Helvetica', 'bold');
  docInstance.setFontSize(9);
  docInstance.text('3. MONTHLY BUDGET LIMITS', 108, 60);

  let budgetHeaderY = 64;
  docInstance.setFillColor(238, 242, 238);
  docInstance.rect(108, budgetHeaderY, 90, 5.5, 'F');
  docInstance.setFont('Helvetica', 'bold');
  docInstance.setFontSize(7);
  docInstance.setTextColor(50, 60, 50);
  docInstance.text('CATEGORY', 110, budgetHeaderY + 3.8);
  docInstance.text('LIMIT', 142, budgetHeaderY + 3.8);
  docInstance.text('SPENT', 168, budgetHeaderY + 3.8);
  docInstance.text('STATUS', 196, budgetHeaderY + 3.8, { align: 'right' });

  docInstance.setFont('Helvetica', 'normal');
  let budgetY = budgetHeaderY + 5.5;
  const displayBudgets = budgets.slice(0, 5); // Top 5 budgets
  displayBudgets.forEach((budget, idx) => {
    if (idx % 2 === 1) {
      docInstance.setFillColor(251, 249, 248);
      docInstance.rect(108, budgetY, 90, 5.5, 'F');
    }

    const spent = transactions
      .filter(t => t.type === 'expense' && t.category.toLowerCase() === budget.category.toLowerCase())
      .reduce((sum, t) => sum + t.amount, 0);

    docInstance.setFontSize(7);
    docInstance.text(budget.category, 110, budgetY + 3.8);
    docInstance.text(`INR ${budget.limit.toLocaleString()}`, 142, budgetY + 3.8);
    docInstance.text(`INR ${spent.toLocaleString()}`, 168, budgetY + 3.8);

    const status = spent > budget.limit ? 'OVER' : 'OK';
    docInstance.setFont('Helvetica', 'bold');
    if (spent > budget.limit) {
      docInstance.setTextColor(180, 20, 20);
    } else {
      docInstance.setTextColor(0, 120, 50);
    }
    docInstance.text(status, 196, budgetY + 3.8, { align: 'right' });
    docInstance.setTextColor(textColor[0], textColor[1], textColor[2]);
    docInstance.setFont('Helvetica', 'normal');

    budgetY += 5.5;
  });

  // 4. Savings Goals Achievements (Numbered as 4)
  let rightGoalSectionY = Math.max(budgetY + 5, 102);
  docInstance.setTextColor(textColor[0], textColor[1], textColor[2]);
  docInstance.setFont('Helvetica', 'bold');
  docInstance.setFontSize(9);
  docInstance.text('4. SAVINGS GOALS ACHIEVEMENTS', 108, rightGoalSectionY);

  // Background Card
  docInstance.setDrawColor(220, 220, 220);
  docInstance.setFillColor(251, 249, 248);
  docInstance.roundedRect(108, rightGoalSectionY + 4, 90, 32, 2, 2, 'FD');

  const fallbackGoals = [
    { name: 'iPad College', currentAmount: 15000, targetAmount: 40000 },
    { name: 'Goa Roomies', currentAmount: 8000, targetAmount: 12000 },
    { name: 'Emergency Fd', currentAmount: 5000, targetAmount: 20000 }
  ];

  // Draw Pie Sector Helper using Triangles
  const drawPieSector = (cx: number, cy: number, r: number, startAngle: number, endAngle: number, fillColor: number[]) => {
    docInstance.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    const steps = 40;
    const angleStep = (endAngle - startAngle) / steps;
    for (let i = 0; i < steps; i++) {
      const a1 = startAngle + i * angleStep;
      const a2 = startAngle + (i + 1) * angleStep;
      const px1 = cx + r * Math.cos(a1);
      const py1 = cy + r * Math.sin(a1);
      const px2 = cx + r * Math.cos(a2);
      const py2 = cy + r * Math.sin(a2);
      docInstance.triangle(cx, cy, px1, py1, px2, py2, 'F');
    }
  };

  const donutRadius = 5.5;
  const innerCutout = 3.6;
  const donutY = rightGoalSectionY + 20;

  for (let i = 0; i < 3; i++) {
    const goal = goals[i] || fallbackGoals[i];
    const cx = 123 + i * 30;

    // Draw Goal Name above
    docInstance.setFont('Helvetica', 'bold');
    docInstance.setFontSize(6.5);
    docInstance.setTextColor(textColor[0], textColor[1], textColor[2]);
    let goalLabel = goal.name;
    if (goalLabel.length > 12) goalLabel = goalLabel.slice(0, 10) + '..';
    docInstance.text(goalLabel, cx, rightGoalSectionY + 9.5, { align: 'center' });

    // Draw base grey circle
    docInstance.setFillColor(230, 232, 230);
    docInstance.circle(cx, donutY, donutRadius, 'F');

    // Draw green progress slice
    const progressVal = goal.currentAmount / goal.targetAmount;
    const pctVal = Math.min(Math.max(progressVal, 0), 1);
    if (pctVal > 0) {
      drawPieSector(cx, donutY, donutRadius, -Math.PI / 2, -Math.PI / 2 + pctVal * 2 * Math.PI, [0, 110, 42]);
    }

    // Draw inner cutout
    docInstance.setFillColor(251, 249, 248);
    docInstance.circle(cx, donutY, innerCutout, 'F');

    // Draw percentage text inside
    docInstance.setFont('Helvetica', 'bold');
    docInstance.setFontSize(5.5);
    docInstance.setTextColor(0, 110, 42);
    docInstance.text(`${Math.round(pctVal * 100)}%`, cx, donutY + 1.8, { align: 'center' });

    // Draw amounts description below
    docInstance.setFont('Helvetica', 'normal');
    docInstance.setFontSize(5.5);
    docInstance.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    
    const savedK = goal.currentAmount >= 1000 ? `${Math.round(goal.currentAmount / 1000)}k` : goal.currentAmount;
    const targetK = goal.targetAmount >= 1000 ? `${Math.round(goal.targetAmount / 1000)}k` : goal.targetAmount;
    docInstance.text(`INR ${savedK}/${targetK}`, cx, rightGoalSectionY + 31.5, { align: 'center' });
  }

  let goalY = rightGoalSectionY + 36;

  // 5. AI Insights Box & Expense Progress Bars (Numbered as 5)
  let insightSectionY = Math.max(goalY + 5, 144);
  docInstance.setTextColor(textColor[0], textColor[1], textColor[2]);
  docInstance.setFont('Helvetica', 'bold');
  docInstance.setFontSize(9);
  docInstance.text('5. FINANCIAL INSIGHT & ANALYTICS', 108, insightSectionY);

  let insightBoxY = insightSectionY + 4;
  docInstance.setFillColor(242, 248, 243); // soft green
  docInstance.setDrawColor(200, 225, 205);
  docInstance.roundedRect(108, insightBoxY, 90, 43, 2, 2, 'FD');

  // Left half text
  docInstance.setTextColor(0, 90, 30);
  docInstance.setFont('Helvetica', 'bold');
  docInstance.setFontSize(8);
  docInstance.text('AI Health Grade: ', 112, insightBoxY + 5.5);
  
  let grade = 'A+ (Excellent)';
  let desc = 'Outstanding budgeting! You are saving a healthy portion of your income.';
  if (savingsRate < 10) {
    grade = 'D (Needs Attention)';
    desc = 'High spending rate. Try reducing discretionary limits to build up your wallet.';
  } else if (savingsRate < 25) {
    grade = 'C (Moderate)';
    desc = 'Decent savings, but there is room to cut back on subscriptions and snacks.';
  } else if (savingsRate < 45) {
    grade = 'B (Good)';
    desc = 'Good job! You are tracking on target for your active savings milestones.';
  }

  docInstance.setTextColor(0, 110, 42);
  docInstance.text(grade, 134, insightBoxY + 5.5);

  docInstance.setTextColor(60, 70, 60);
  docInstance.setFont('Helvetica', 'normal');
  docInstance.setFontSize(7);
  
  const textLines = docInstance.splitTextToSize(desc, 36);
  docInstance.text(textLines, 112, insightBoxY + 11);

  docInstance.setFont('Helvetica', 'bold');
  docInstance.setTextColor(27, 28, 28);
  docInstance.text('Active Peer Settle Balances', 112, insightBoxY + 24);
  
  docInstance.setFont('Helvetica', 'normal');
  docInstance.setFontSize(6.5);
  docInstance.setTextColor(80, 80, 80);
  docInstance.text('• peer splits process live', 112, insightBoxY + 29);
  docInstance.text('• local ledger synced', 112, insightBoxY + 34);
  docInstance.text('• room accounts active', 112, insightBoxY + 39);

  // Right half horizontal bar chart
  let rightBarY = insightBoxY + 5.5;
  docInstance.setTextColor(27, 28, 28);
  docInstance.setFont('Helvetica', 'bold');
  docInstance.setFontSize(7.5);
  docInstance.text('Expense Distribution', 152, rightBarY);
  
  rightBarY += 3.5;
  sortedCategoriesLeft.slice(0, 3).forEach(([cat, amt]) => {
    docInstance.setFont('Helvetica', 'normal');
    docInstance.setFontSize(6.2);
    docInstance.setTextColor(60, 60, 60);
    docInstance.text(`${cat}: INR ${amt.toLocaleString()}`, 152, rightBarY + 2.5);

    // Track
    docInstance.setFillColor(230, 235, 230);
    docInstance.roundedRect(152, rightBarY + 3.8, 38, 1.8, 0.8, 0.8, 'F');

    // Fill
    const fillWidth = (amt / maxValLeft) * 38;
    docInstance.setFillColor(0, 110, 42); // Primary Green
    docInstance.roundedRect(152, rightBarY + 3.8, fillWidth, 1.8, 0.8, 0.8, 'F');

    rightBarY += 9;
  });

  // 6. Balance Trend Line Graph (Numbered as 6)
  let chartSectionY = Math.max(insightBoxY + 43 + 5, 196);
  docInstance.setTextColor(textColor[0], textColor[1], textColor[2]);
  docInstance.setFont('Helvetica', 'bold');
  docInstance.setFontSize(9);
  docInstance.text('6. WALLET BALANCE TREND', 108, chartSectionY);

  let chartY = chartSectionY + 5;
  let chartH = 22;
  let chartX = 118;
  let chartW = 76;

  // Balance trend path
  let tempBalance = balance;
  const points = [tempBalance];
  for (let i = 0; i < Math.min(transactions.length, 5); i++) {
    const tx = transactions[i];
    if (tx.type === 'income') {
      tempBalance -= tx.amount;
    } else {
      tempBalance += tx.amount;
    }
    points.unshift(tempBalance);
  }

  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  const valRange = maxVal - minVal || 1;

  // Grid
  const gridY0 = chartY + chartH;
  const gridY50 = chartY + chartH / 2;
  const gridY100 = chartY;
  
  docInstance.setDrawColor(240, 240, 240);
  docInstance.setLineWidth(0.2);
  docInstance.line(chartX, gridY0, chartX + chartW, gridY0);
  docInstance.line(chartX, gridY50, chartX + chartW, gridY50);
  docInstance.line(chartX, gridY100, chartX + chartW, gridY100);

  // Y Labels
  docInstance.setFontSize(5.5);
  docInstance.setTextColor(150, 150, 150);
  docInstance.text(`INR ${Math.round(minVal).toLocaleString()}`, chartX - 2, gridY0 + 1.2, { align: 'right' });
  docInstance.text(`INR ${Math.round((minVal + maxVal) / 2).toLocaleString()}`, chartX - 2, gridY50 + 1.2, { align: 'right' });
  docInstance.text(`INR ${Math.round(maxVal).toLocaleString()}`, chartX - 2, gridY100 + 1.2, { align: 'right' });

  // Plot line
  docInstance.setDrawColor(0, 110, 42);
  docInstance.setLineWidth(0.6);
  
  const pointsCount = points.length;
  const stepX = chartW / (pointsCount - 1 || 1);

  points.forEach((val, idx) => {
    const px = chartX + idx * stepX;
    const py = chartY + chartH - ((val - minVal) / valRange) * chartH;

    docInstance.setFillColor(0, 110, 42);
    docInstance.circle(px, py, 0.7, 'FD');

    if (idx < pointsCount - 1) {
      const nextVal = points[idx + 1];
      const npx = chartX + (idx + 1) * stepX;
      const npy = chartY + chartH - ((nextVal - minVal) / valRange) * chartH;
      docInstance.line(px, py, npx, npy);
    }
  });

  // X Labels (dates)
  docInstance.setFontSize(5);
  docInstance.setTextColor(150, 150, 150);
  const displayTxDates = transactions.slice(0, pointsCount).reverse();
  displayTxDates.forEach((tx, idx) => {
    const px = chartX + idx * stepX;
    docInstance.text(tx.date.slice(5), px, gridY0 + 3.5, { align: 'center' });
  });

  drawFooter();

  // Save the document
  const fileName = `FinBuddy_Statement_${user.displayName?.replace(/\s+/g, '_') || 'Student'}.pdf`;
  docInstance.save(fileName);
};
