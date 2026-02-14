/// Maps specialty names (e.g., "Pediatrician") to service names (e.g., "Pediatrics")
/// This provides a more user-friendly display name for services.
String getServiceDisplayName(String? specialtyOrType) {
  if (specialtyOrType == null || specialtyOrType.isEmpty) {
    return '';
  }

  final lowerName = specialtyOrType.toLowerCase().trim();

  // Map common specialty names to service names
  if (lowerName.contains('pediatric')) {
    if (lowerName.contains('geneticist') || lowerName.contains('genetic')) {
      return 'Pediatric Genetics';
    }
    return 'Pediatrics';
  }

  if (lowerName.contains('geneticist') || lowerName.contains('genetic')) {
    return 'Genetics';
  }

  if (lowerName.contains('cardiolog')) {
    return 'Cardiology';
  }

  if (lowerName.contains('dermatolog')) {
    return 'Dermatology';
  }

  if (lowerName.contains('neurolog')) {
    return 'Neurology';
  }

  if (lowerName.contains('orthoped') || lowerName.contains('orthoped')) {
    return 'Orthopedics';
  }

  if (lowerName.contains('ophthalm') || lowerName.contains('eye')) {
    return 'Ophthalmology';
  }

  if (lowerName.contains('gynec') || lowerName.contains('obstet')) {
    return 'Gynecology';
  }

  if (lowerName.contains('urolog')) {
    return 'Urology';
  }

  if (lowerName.contains('internal') || lowerName.contains('internist')) {
    return 'Internal Medicine';
  }

  if (lowerName.contains('general') && lowerName.contains('practic')) {
    return 'General Practice';
  }

  if (lowerName.contains('surgeon') || lowerName.contains('surgery')) {
    return 'Surgery';
  }

  if (lowerName.contains('psychiatr')) {
    return 'Psychiatry';
  }

  if (lowerName.contains('psycholog')) {
    return 'Psychology';
  }

  if (lowerName.contains('endocrin')) {
    return 'Endocrinology';
  }

  if (lowerName.contains('gastro')) {
    return 'Gastroenterology';
  }

  if (lowerName.contains('pulmon') || lowerName.contains('lung')) {
    return 'Pulmonology';
  }

  if (lowerName.contains('rheumat')) {
    return 'Rheumatology';
  }

  if (lowerName.contains('oncolog')) {
    return 'Oncology';
  }

  if (lowerName.contains('nephrol') || lowerName.contains('kidney')) {
    return 'Nephrology';
  }

  if (lowerName.contains('ent') || lowerName.contains('otolaryng')) {
    return 'ENT';
  }

  if (lowerName.contains('consult')) {
    return 'Consultation';
  }

  // If no mapping found, return the original value
  // (it might already be a service name like "Pediatrics")
  return specialtyOrType;
}
