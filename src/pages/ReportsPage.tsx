import { useState, useMemo } from 'react';
import { Task, RoadmapMap, Note, FileItem } from '../types';
import { downloadFile } from '../utils/storage';

interface ReportsPageProps {
  tasks: Task[];
  roadmaps: RoadmapMap[];
  notes: Note[];
  files?: FileItem[];
}

type TimeHorizon = 'weekly' | 'monthly' | 'all-time';

export function ReportsPage({ tasks, roadmaps, notes, files = [] }: ReportsPageProps) {
  const [horizon, setHorizon] = useState<TimeHorizon>('weekly');

  // Filter tasks based on selected time horizon
  const filteredTasks = useMemo(() => {
    if (horizon === 'all-time') return tasks;

    const now = new Date();
    const cutoff = new Date();
    if (horizon === 'weekly') {
      cutoff.setDate(now.getDate() - 7);
    } else {
      cutoff.setDate(now.getDate() - 30);
    }

    return tasks.filter((t) => {
      const taskDate = t.createdAt ? new Date(t.createdAt) : new Date();
      return taskDate >= cutoff;
    });
  }, [tasks, horizon]);

  // General Metrics Calculation
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t) => t.status === 'complete').length;
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'progress').length;
  const pendingTasks = filteredTasks.filter((t) => t.status === 'pending').length;

  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Overdue Tasks Calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = filteredTasks.filter(
    (t) => t.status !== 'complete' && t.dueDate && t.dueDate < todayStr
  );

  // Priority Metrics
  const highPriorityTotal = filteredTasks.filter((t) => t.priority === 'high').length;
  const highPriorityDone = filteredTasks.filter(
    (t) => t.priority === 'high' && t.status === 'complete'
  ).length;
  const highPriorityRate =
    highPriorityTotal > 0 ? Math.round((highPriorityDone / highPriorityTotal) * 100) : 0;

  // Roadmap Metrics
  const allNodes = roadmaps.flatMap((r) => r.nodes);
  const totalNodes = allNodes.length;
  const completedNodes = allNodes.filter((n) => n.state === 'complete').length;
  const roadmapCompletionRate =
    totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

  // Period Scope Date Range & Velocity Metadata
  const periodInfo = useMemo(() => {
    const now = new Date();
    const formatDate = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (horizon === 'weekly') {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      const velocity = (completedTasks / 7).toFixed(1);
      return {
        label: 'Weekly Report (Last 7 Days)',
        range: `${formatDate(past)} – ${formatDate(now)}`,
        velocity: `${velocity} tasks / day`
      };
    } else if (horizon === 'monthly') {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      const velocity = (completedTasks / 4.3).toFixed(1);
      return {
        label: 'Monthly Analysis (Last 30 Days)',
        range: `${formatDate(past)} – ${formatDate(now)}`,
        velocity: `${velocity} tasks / week`
      };
    }
    return {
      label: 'All-Time Workspace Overview',
      range: `Full Workspace Lifespan (${tasks.length} total tasks logged)`,
      velocity: `${completedTasks} total completed tasks`
    };
  }, [horizon, completedTasks, tasks.length]);

  // Overall Algorithmic Productivity Score (0 - 100)
  const productivityScore = useMemo(() => {
    if (totalTasks === 0 && totalNodes === 0) return 0;
    const taskWeight = totalTasks > 0 ? (completedTasks / totalTasks) * 40 : 20;
    const highPriWeight = highPriorityTotal > 0 ? (highPriorityDone / highPriorityTotal) * 30 : 15;
    const roadmapWeight = totalNodes > 0 ? (completedNodes / totalNodes) * 20 : 10;
    const notesWeight = Math.min(10, notes.length * 2);
    const overduePenalty = overdueTasks.length * 5;

    const raw = Math.round(taskWeight + highPriWeight + roadmapWeight + notesWeight - overduePenalty);
    return Math.max(0, Math.min(100, raw));
  }, [
    totalTasks,
    completedTasks,
    highPriorityTotal,
    highPriorityDone,
    totalNodes,
    completedNodes,
    notes.length,
    overdueTasks.length
  ]);

  // Score Status Tag
  const getScoreTag = (score: number) => {
    if (score >= 80) return { label: 'OPTIMAL VELOCITY', type: 'optimal', color: 'var(--status-complete)' };
    if (score >= 50) return { label: 'BALANCED EXECUTION', type: 'balanced', color: 'var(--status-progress)' };
    return { label: 'ATTENTION NEEDED', type: 'attention', color: 'var(--accent)' };
  };
  const scoreTag = getScoreTag(productivityScore);

  // Category Distribution for Donut Chart
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTasks.forEach((t) => {
      const cat = t.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const total = filteredTasks.length || 1;
    const colors = ['#e63946', '#2a9d8f', '#e76f51', '#f4a261', '#457b9d', '#9d4edd'];
    return Object.entries(counts).map(([name, count], idx) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
      color: colors[idx % colors.length]
    }));
  }, [filteredTasks]);

  // AI-Style Bottleneck & "Where User is Lacking" Analysis
  const bottlenecks = useMemo(() => {
    const list: string[] = [];
    if (overdueTasks.length > 0) {
      list.push(
        `Overdue Tasks Alert: You have ${overdueTasks.length} task(s) past due dates (e.g., "${overdueTasks[0].title}").`
      );
    }
    if (pendingTasks > completedTasks && totalTasks > 2) {
      list.push(
        `Task Accumulation: Pending tasks (${pendingTasks}) exceed completed tasks (${completedTasks}). Consider clearing small items first.`
      );
    }
    if (highPriorityTotal > 0 && highPriorityDone === 0) {
      list.push(
        `Priority Gap: None of your ${highPriorityTotal} High-Priority task(s) have been completed yet.`
      );
    }
    const stalledRoadmap = roadmaps.find(
      (r) => r.nodes.length > 0 && r.nodes.every((n) => n.state !== 'complete')
    );
    if (stalledRoadmap) {
      list.push(
        `Stalled Blueprint: Roadmap "${stalledRoadmap.title}" has 0 completed milestones.`
      );
    }
    if (notes.length === 0) {
      list.push(`Zero Documentation: No daily work log notes recorded in system.`);
    }
    if (list.length === 0) {
      list.push(`Excellent Work! No critical execution bottlenecks identified.`);
    }
    return list;
  }, [overdueTasks, pendingTasks, completedTasks, totalTasks, highPriorityTotal, highPriorityDone, roadmaps, notes.length]);

  // Accomplishments Summary
  const accomplishments = useMemo(() => {
    const list: string[] = [];
    if (completedTasks > 0) {
      list.push(`Successfully completed ${completedTasks} task(s) during this period.`);
    }
    if (highPriorityDone > 0) {
      list.push(`Resolved ${highPriorityDone} High-Priority core objective(s).`);
    }
    if (completedNodes > 0) {
      list.push(`Advanced ${completedNodes} roadmap milestone node(s) to completion.`);
    }
    if (notes.length > 0) {
      list.push(`Logged ${notes.length} workspace note(s) & documentation journal(s).`);
    }
    if (files.length > 0) {
      list.push(`Uploaded and indexed ${files.length} attachment file record(s).`);
    }
    if (list.length === 0) {
      list.push('No completed activities logged yet. Select or complete tasks in Tasks tab.');
    }
    return list;
  }, [completedTasks, highPriorityDone, completedNodes, notes.length, files.length]);

  // Actionable AI Recommendations
  const recommendations = useMemo(() => {
    const recs: { title: string; desc: string; type: 'urgent' | 'roadmap' | 'doc' }[] = [];
    if (overdueTasks.length > 0) {
      recs.push({
        title: 'Clear Overdue Items',
        desc: `Resolve ${overdueTasks.length} overdue task(s) immediately to recover productivity score momentum.`,
        type: 'urgent'
      });
    }
    if (highPriorityTotal - highPriorityDone > 0) {
      recs.push({
        title: 'Focus High Priority',
        desc: `Shift focus to ${highPriorityTotal - highPriorityDone} remaining High-Priority task(s) before starting new low-priority items.`,
        type: 'urgent'
      });
    }
    if (roadmapCompletionRate < 100 && totalNodes > 0) {
      recs.push({
        title: 'Advance Blueprint Nodes',
        desc: `Move ${totalNodes - completedNodes} pending roadmap node(s) forward to maintain delivery milestone pace.`,
        type: 'roadmap'
      });
    }
    if (notes.length < 3) {
      recs.push({
        title: 'Record Work Logs',
        desc: 'Create daily work notes to capture technical knowledge and design decisions.',
        type: 'doc'
      });
    }
    return recs;
  }, [overdueTasks.length, highPriorityTotal, highPriorityDone, roadmapCompletionRate, totalNodes, completedNodes, notes.length]);

  // Export Summary Function
  const handleExportSummary = () => {
    const summaryText = `
================================================================================
DAYMARK ECOSYSTEM — EXECUTIVE WORKPLACE & ANALYTICS REPORT
================================================================================
Report Scope: ${periodInfo.label.toUpperCase()}
Date Range: ${periodInfo.range}
Execution Velocity: ${periodInfo.velocity}
Generated On: ${new Date().toLocaleString()}
Productivity Score: ${productivityScore}% [${scoreTag.label}]

1. TASK EXECUTION METRICS:
   - Total Tasks Logged: ${totalTasks}
   - Completed Tasks: ${completedTasks} (${taskCompletionRate}%)
   - In Progress: ${inProgressTasks}
   - Pending: ${pendingTasks}
   - Overdue Tasks: ${overdueTasks.length}
   - High Priority Completion: ${highPriorityDone} / ${highPriorityTotal} (${highPriorityRate}%)

2. ROADMAP BLUEPRINT PROGRESS:
   - Total Roadmap Blueprints: ${roadmaps.length}
   - Total Milestone Nodes: ${totalNodes}
   - Completed Milestones: ${completedNodes} (${roadmapCompletionRate}%)

3. KNOWLEDGE & FILE REPOSITORY:
   - Total Notes & Journals: ${notes.length}
   - Total File Attachments: ${files.length}

4. IDENTIFIED BOTTLENECKS & AREAS FOR IMPROVEMENT ("WHERE LACKING"):
${bottlenecks.map((b) => `   * ${b}`).join('\n')}

5. ACCOMPLISHMENTS SUMMARY:
${accomplishments.map((a) => `   * ${a}`).join('\n')}

6. ACTIONABLE STRATEGIC RECOMMENDATIONS:
${recommendations.map((r) => `   * [${r.title}] ${r.desc}`).join('\n')}
================================================================================
    `.trim();

    downloadFile(
      `Daymark_${horizon.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.txt`,
      summaryText,
      'text/plain;charset=utf-8;'
    );
  };

  const handlePrintPdf = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('PDF Print triggers unavailable in this view:', err);
    }
  };

  return (
    <section className="page reports-page">
      {/* Top Header Controls Bar */}
      <div className="reports-toolbar">
        <div className="reports-toolbar-left">
          <p className="eyebrow">AUTOMATED WORKPLACE ANALYTICS & INTELLIGENCE</p>
          <div className="horizon-tabs-group">
            <button
              type="button"
              className={`horizon-btn ${horizon === 'weekly' ? 'active' : ''}`}
              onClick={() => setHorizon('weekly')}
            >
              Weekly Report
            </button>
            <button
              type="button"
              className={`horizon-btn ${horizon === 'monthly' ? 'active' : ''}`}
              onClick={() => setHorizon('monthly')}
            >
              Monthly Analysis
            </button>
            <button
              type="button"
              className={`horizon-btn ${horizon === 'all-time' ? 'active' : ''}`}
              onClick={() => setHorizon('all-time')}
            >
              All-Time Overview
            </button>
          </div>
        </div>

        <div className="reports-actions">
          <button type="button" className="quiet-button sm-btn" onClick={handlePrintPdf}>
            Print / Save PDF
          </button>
          <button type="button" className="primary-button sm-btn" onClick={handleExportSummary}>
            Download Summary (.txt)
          </button>
        </div>
      </div>

      {/* Scope Date Range & Velocity Banner */}
      <div className="period-scope-banner">
        <span>Scope: <strong>{periodInfo.label}</strong></span>
        <span>Date Range: <strong>{periodInfo.range}</strong></span>
        <span>Velocity Rate: <strong>{periodInfo.velocity}</strong></span>
      </div>

      {/* Executive Productivity Score & Core KPI Grid */}
      <div className="reports-top-grid">
        {/* Productivity Score Circular Card */}
        <div className="productivity-score-card">
          <p className="eyebrow">OVERALL PRODUCTIVITY SCORE</p>
          <div className="score-ring-wrapper">
            <svg width="120" height="120" viewBox="0 0 120 120" className="score-circle-svg">
              <circle cx="60" cy="60" r="50" className="score-circle-bg" />
              <circle
                cx="60"
                cy="60"
                r="50"
                className="score-circle-fill"
                style={{
                  stroke: scoreTag.color,
                  strokeDasharray: 314,
                  strokeDashoffset: 314 - (314 * productivityScore) / 100
                }}
              />
            </svg>
            <div className="score-value-text">
              <strong>{productivityScore}%</strong>
              <span>SCORE</span>
            </div>
          </div>
          <div className={`score-status-badge ${scoreTag.type}`}>
            {scoreTag.label}
          </div>
        </div>

        {/* Key KPI Cards Grid */}
        <div className="kpi-cards-grid">
          <div className="report-card kpi-card">
            <p className="eyebrow">TASK COMPLETION</p>
            <strong>{taskCompletionRate}%</strong>
            <span>{completedTasks} of {totalTasks} tasks completed</span>
            <div className="mini-progress-bar">
              <div className="fill" style={{ width: `${taskCompletionRate}%` }} />
            </div>
          </div>

          <div className="report-card kpi-card">
            <p className="eyebrow">ROADMAP VELOCITY</p>
            <strong>{roadmapCompletionRate}%</strong>
            <span>{completedNodes} of {totalNodes} blueprint milestones</span>
            <div className="mini-progress-bar">
              <div className="fill accent" style={{ width: `${roadmapCompletionRate}%` }} />
            </div>
          </div>

          <div className="report-card kpi-card">
            <p className="eyebrow">HIGH-PRIORITY WIN RATE</p>
            <strong>{highPriorityRate}%</strong>
            <span>{highPriorityDone} of {highPriorityTotal} high priority tasks</span>
            <div className="mini-progress-bar">
              <div className="fill" style={{ width: `${highPriorityRate}%`, backgroundColor: 'var(--accent)' }} />
            </div>
          </div>

          <div className="report-card kpi-card">
            <p className="eyebrow">REPOSITORY RECS</p>
            <strong>{notes.length + files.length}</strong>
            <span>{notes.length} notes · {files.length} file attachments</span>
          </div>
        </div>
      </div>

      {/* Visual SVG Charts Section */}
      <div className="charts-section-grid">
        {/* SVG Task Status Velocity Bar Chart */}
        <div className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h3>Workplace Execution Breakdown</h3>
              <p className="sub-text">Distribution of completed, in-progress, and pending tasks</p>
            </div>
          </div>

          <div className="status-bars-container">
            <div className="status-bar-row">
              <div className="bar-label">
                <span>Completed Tasks</span>
                <strong>{completedTasks} ({taskCompletionRate}%)</strong>
              </div>
              <div className="bar-track">
                <div className="bar-fill green" style={{ width: `${taskCompletionRate}%` }} />
              </div>
            </div>

            <div className="status-bar-row">
              <div className="bar-label">
                <span>In Progress Tasks</span>
                <strong>
                  {inProgressTasks} ({totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}%)
                </strong>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill yellow"
                  style={{
                    width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div className="status-bar-row">
              <div className="bar-label">
                <span>Pending Tasks</span>
                <strong>
                  {pendingTasks} ({totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0}%)
                </strong>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill red"
                  style={{
                    width: `${totalTasks > 0 ? (pendingTasks / totalTasks) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {overdueTasks.length > 0 && (
              <div className="status-bar-row overdue-row">
                <div className="bar-label">
                  <span>Overdue Tasks (Risk)</span>
                  <strong style={{ color: 'var(--accent)' }}>{overdueTasks.length} Overdue</strong>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill alert"
                    style={{
                      width: `${Math.min(100, (overdueTasks.length / (totalTasks || 1)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SVG Donut Chart Category Work Breakdown */}
        <div className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h3>Work Distribution by Category</h3>
              <p className="sub-text">Workload emphasis across system categories</p>
            </div>
          </div>

          <div className="donut-chart-container">
            {categoryStats.length > 0 ? (
              <div className="donut-content-flex">
                <div className="donut-svg-wrapper">
                  <svg width="140" height="140" viewBox="0 0 140 140" className="donut-svg">
                    <circle cx="70" cy="70" r="50" fill="none" stroke="#25221e" strokeWidth="20" />
                    {(() => {
                      let accumulatedDegree = 0;
                      return categoryStats.map((cat, i) => {
                        const strokeDash = (cat.percentage / 100) * 314;
                        const strokeOffset = 314 - strokeDash;
                        const rotateAngle = (accumulatedDegree / 100) * 360 - 90;
                        accumulatedDegree += cat.percentage;
                        return (
                          <circle
                            key={i}
                            cx="70"
                            cy="70"
                            r="50"
                            fill="none"
                            stroke={cat.color}
                            strokeWidth="20"
                            strokeDasharray="314"
                            strokeDashoffset={strokeOffset}
                            transform={`rotate(${rotateAngle} 70 70)`}
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="donut-center-text">
                    <strong>{categoryStats.length}</strong>
                    <span>Categories</span>
                  </div>
                </div>

                <div className="donut-legend-list">
                  {categoryStats.map((cat, idx) => (
                    <div key={idx} className="legend-item">
                      <span className="legend-dot" style={{ backgroundColor: cat.color }} />
                      <span className="legend-name">{cat.name}</span>
                      <span className="legend-val">{cat.count} ({cat.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="empty-text">No category task data logged for this period.</p>
            )}
          </div>
        </div>
      </div>

      {/* AI Intelligence & Bottleneck Evaluation ("Where User is Lacking") */}
      <section className="panel ai-intelligence-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">ALGORITHMIC WORKPLACE EVALUATION</span>
            <h2>Bottleneck & Performance Intelligence</h2>
          </div>
          <span className="ai-engine-badge">DAYMARK LOCAL AI ENGINE</span>
        </div>

        <div className="intelligence-grid">
          {/* Identified Bottlenecks ("Where User is Lacking") */}
          <div className="insight-card lacking-card">
            <div className="insight-card-header">
              <h3>Areas For Improvement ("Where You Are Lacking")</h3>
              <span className="count-tag alert">{bottlenecks.length} Identified</span>
            </div>
            <p className="insight-sub">
              Automated detection of overdue items, stalled roadmaps, or workload imbalances:
            </p>
            <ul className="insight-list">
              {bottlenecks.map((item, idx) => (
                <li key={idx} className="insight-item lacking">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Accomplishments & Strengths */}
          <div className="insight-card strength-card">
            <div className="insight-card-header">
              <h3>Accomplishments & Key Wins</h3>
              <span className="count-tag success">{accomplishments.length} Highlights</span>
            </div>
            <p className="insight-sub">
              Summary of completed milestones, notes recorded, and execution speed:
            </p>
            <ul className="insight-list">
              {accomplishments.map((item, idx) => (
                <li key={idx} className="insight-item strength">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actionable Strategy Recommendations */}
        <div className="recommendations-section">
          <h3>Strategic Action Plan & Recommendations</h3>
          <div className="recommendations-grid">
            {recommendations.length > 0 ? (
              recommendations.map((rec, idx) => (
                <div key={idx} className={`rec-card ${rec.type}`}>
                  <div className="rec-card-header">
                    <h4>{rec.title}</h4>
                    <span className={`rec-type-badge ${rec.type}`}>{rec.type.toUpperCase()}</span>
                  </div>
                  <p>{rec.desc}</p>
                </div>
              ))
            ) : (
              <p className="empty-text">No pending strategic recommendations. Workload is optimal.</p>
            )}
          </div>
        </div>
      </section>

      {/* Monthly & Blueprint Execution Audit Table */}
      <section className="panel monthly-audit-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">DETAILED ACTIVITY AUDIT</span>
            <h2>Task Execution & Blueprint Status</h2>
          </div>
        </div>

        <div className="breakdown-grid">
          {/* Action Items List */}
          <div className="breakdown-item">
            <h3>Logged Action Items ({filteredTasks.length})</h3>
            <div className="audit-tasks-list">
              {filteredTasks.map((t) => (
                <div key={t.id} className="audit-task-row">
                  <div className="audit-task-main">
                    <span className={`status-dot ${t.status === 'complete' ? 'green' : t.status === 'progress' ? 'yellow' : 'red'}`} />
                    <strong>{t.title}</strong>
                  </div>
                  <div className="audit-task-meta">
                    <span className="cat-chip">{t.category || 'General'}</span>
                    <span className={`pri-chip ${t.priority}`}>{t.priority.toUpperCase()}</span>
                    <span className="status-label">{t.status.toUpperCase()}</span>
                  </div>
                </div>
              ))}
              {filteredTasks.length === 0 && <p className="empty-text">No task records found.</p>}
            </div>
          </div>

          {/* Roadmap Blueprints Progress */}
          <div className="breakdown-item">
            <h3>Active Roadmap Blueprints ({roadmaps.length})</h3>
            <div className="audit-blueprints-list">
              {roadmaps.map((r) => {
                const rComplete = r.nodes.filter((n) => n.state === 'complete').length;
                const rTotal = r.nodes.length;
                const pct = rTotal > 0 ? Math.round((rComplete / rTotal) * 100) : 0;
                return (
                  <div key={r.id} className="audit-blueprint-card">
                    <div className="blueprint-card-top">
                      <strong>{r.title}</strong>
                      <span className="blueprint-pct">{pct}% Done</span>
                    </div>
                    <p className="blueprint-desc">{r.description}</p>
                    <div className="mini-progress-bar">
                      <div className="fill accent" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="nodes-tag-row">
                      <span>Milestones: {rComplete} / {rTotal} completed</span>
                    </div>
                  </div>
                );
              })}
              {roadmaps.length === 0 && <p className="empty-text">No active roadmap blueprints.</p>}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
