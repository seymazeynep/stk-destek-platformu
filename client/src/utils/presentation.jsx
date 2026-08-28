import {
  Accessibility,
  Baby,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Flame,
  GraduationCap,
  HandHeart,
  HeartHandshake,
  HeartPulse,
  Landmark,
  Lightbulb,
  Medal,
  Network,
  Palette,
  Scale,
  ShieldCheck,
  Sparkles,
  Trees,
  Trophy,
  Wheat,
  Globe2,
} from 'lucide-react';

export const ICONS = {
  organization: Building2,
  association: Building2,
  foundation: Landmark,
  verified: ShieldCheck,
  success: CheckCircle2,
  guide: Sparkles,
  education: GraduationCap,
  support: HandHeart,
  health: HeartPulse,
  accessibility: Accessibility,
  environment: Trees,
  children: Baby,
  youth: Sparkles,
  justice: Scale,
  culture: Palette,
  work: BriefcaseBusiness,
  sport: Trophy,
  public: Landmark,
  knowledge: BookOpen,
  innovation: Lightbulb,
  international: Globe2,
  agriculture: Wheat,
  network: Network,
  achievement: Medal,
  solidarity: HeartHandshake,
  emergency: Flame,
  wellbeing: Brain,
};

export const API_ICON_MAP = {
  Accessibility: ICONS.accessibility,
  Baby: ICONS.children,
  BookOpen: ICONS.knowledge,
  Brain: ICONS.wellbeing,
  Briefcase: ICONS.work,
  Building: ICONS.organization,
  Building2: ICONS.organization,
  Flame: ICONS.emergency,
  Globe: ICONS.international,
  GraduationCap: ICONS.education,
  HandHeart: ICONS.support,
  Heart: ICONS.support,
  HeartHandshake: ICONS.solidarity,
  HeartPulse: ICONS.health,
  Landmark: ICONS.public,
  Lightbulb: ICONS.innovation,
  Medal: ICONS.achievement,
  Network: ICONS.network,
  Palette: ICONS.culture,
  Scale: ICONS.justice,
  ShieldCheck: ICONS.verified,
  Sparkles: ICONS.youth,
  Trees: ICONS.environment,
  Trophy: ICONS.sport,
  Wheat: ICONS.agriculture,
};

export function getOrganizationType(stk) {
  return String(stk?.kurum_turu || '').toLocaleLowerCase('tr-TR') === 'vakıf' ||
    String(stk?.kurum_turu || '').toLocaleLowerCase('tr-TR') === 'vakif'
    ? 'vakif'
    : 'dernek';
}

export function getOrganizationTypeLabel(stk) {
  return getOrganizationType(stk) === 'vakif' ? 'Vakıf' : 'Dernek';
}

export function getOrganizationIcon(stk) {
  return getOrganizationType(stk) === 'vakif' ? ICONS.foundation : ICONS.association;
}

export function getRegistryInfo(stk) {
  if (getOrganizationType(stk) === 'vakif') {
    return {
      label: stk?.veri_kaynagi ? `${stk.veri_kaynagi} kaynak kaydı` : 'Vakıf kaynak kaydı',
      shortLabel: 'Kaynak ID',
      value: stk?.kaynak_id || stk?.kutuk_no || 'Belirtilmemiş',
      source: stk?.veri_kaynagi || 'Vakıflar Genel Müdürlüğü',
    };
  }

  return {
    label: 'Dernek sicil kaydı',
    shortLabel: 'Kütük No',
    value: stk?.kutuk_no || stk?.kaynak_id || 'Belirtilmemiş',
    source: stk?.veri_kaynagi || 'DERBİS',
  };
}

export function getOrganizationDistribution(stats) {
  const rawDistribution = stats?.organizationTypeDistribution || [];
  const distribution = Array.isArray(rawDistribution)
    ? Object.fromEntries(
        rawDistribution.map(item => [
          String(item.organizationType || item.type || '').toLocaleLowerCase('tr-TR'),
          Number(item.count || 0),
        ])
      )
    : rawDistribution;
  const read = (key) => Number(
    distribution[key] ??
    distribution[key.toLocaleUpperCase('tr-TR')] ??
    distribution[key[0].toLocaleUpperCase('tr-TR') + key.slice(1)] ??
    0
  );

  return {
    associations: read('dernek'),
    foundations: read('vakif') || read('vakıf'),
  };
}
