function getDaysUntilNeeded(dateNeeded) {
  const neededDate = new Date(dateNeeded);

  if (Number.isNaN(neededDate.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  neededDate.setHours(0, 0, 0, 0);

  return Math.ceil((neededDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function calculateScreeningResult(payload) {
  const reasons = [];
  let score = 0;

  const normalizedType = String(payload.requestType || '').trim().toLowerCase();
  const normalizedPurpose = String(payload.purpose || '').trim();
  const normalizedNotes = String(payload.additionalNotes || '').trim();
  const hasSupportingDocument = Boolean(payload.supportingFileName);
  const daysUntilNeeded = getDaysUntilNeeded(payload.dateNeeded);

  if (normalizedType === 'complaint') {
    score += 4;
    reasons.push('Complaint submissions require closer screening by default.');
  } else if (normalizedType === 'other') {
    score += 2;
    reasons.push('Custom request types need additional verification.');
  } else if (normalizedType === 'letter') {
    score += 1;
    reasons.push('Supporting letters may need manual validation.');
  }

  if (daysUntilNeeded !== null) {
    if (daysUntilNeeded <= 1) {
      score += 3;
      reasons.push('The requested date is extremely urgent.');
    } else if (daysUntilNeeded <= 3) {
      score += 2;
      reasons.push('The requested date is close and should be reviewed soon.');
    } else if (daysUntilNeeded <= 7) {
      score += 1;
      reasons.push('The requested date is within the next week.');
    }
  }

  if (!hasSupportingDocument) {
    score += 2;
    reasons.push('No supporting document was attached.');
  } else {
    reasons.push('A supporting document was attached.');
  }

  if (normalizedPurpose.length < 30) {
    score += 2;
    reasons.push('The request purpose is brief and may need clarification.');
  } else if (normalizedPurpose.length < 60) {
    score += 1;
    reasons.push('The request purpose is somewhat limited in detail.');
  }

  if (normalizedNotes && normalizedNotes.length >= 40) {
    score = Math.max(0, score - 1);
    reasons.push('Additional notes provided more context for screening.');
  }

  let screeningStatus = 'low_concern';

  if (score >= 7) {
    screeningStatus = 'high_concern';
  } else if (score >= 4) {
    screeningStatus = 'needs_review';
  }

  return {
    score,
    screeningStatus,
    summary: reasons.join(' ')
  };
}

module.exports = { calculateScreeningResult };
