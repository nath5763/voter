import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Card, Divider, Label, LinkButton, PageHeader, PrototypeBanner, Screen, SectionTitle, SourceLine, StatusPill } from '@/components/ui';
import { palette, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import type { Deadline } from '@/types/domain';

const deadlineKeys: Record<Deadline['type'], string> = {
  REGISTRATION: 'registration', EARLY_START: 'earlyStart', EARLY_END: 'earlyEnd', MAIL_REQUEST: 'mailRequest',
  MAIL_RETURN: 'mailReturn', ELECTION_DAY: 'electionDay',
};

export default function ElectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dataset, locale, profile, t } = useApp();
  const election = dataset?.elections.find((item) => item.id === id);
  if (!election) return <Screen><LinkButton label={t('back')} onPress={() => router.back()} /><PageHeader title={t('unavailable')} /><Body>{t('noElections')}</Body></Screen>;
  const getSource = (sourceId: string) => dataset?.sources.find((source) => source.id === sourceId);

  return (
    <Screen>
      <LinkButton label={t('back')} onPress={() => router.back()} />
      <PageHeader eyebrow={t('electionDetails')} title={election.name} body={`${formatDate(election.date, locale, election.timeZone)} · ${profile?.jurisdiction.congressionalDistrict}`} />
      <PrototypeBanner />
      <View style={styles.statusRow}><StatusPill status={election.status} /><Text style={styles.jurisdiction}>{election.jurisdiction}</Text></View>

      <SectionTitle>{t('keyDates')}</SectionTitle>
      <Card>
        {election.deadlines.map((deadline, index) => (
          <View key={deadline.id} style={styles.deadlineBlock}>
            {index > 0 ? <Divider /> : null}
            <View style={styles.rowBetween}>
              <View style={styles.deadlineCopy}>
                <Text style={styles.deadlineName}>{t(deadlineKeys[deadline.type])}</Text>
                <Text style={styles.deadlineDate}>{formatDate(deadline.date, locale, deadline.timeZone ?? election.timeZone)}</Text>
                {deadline.qualifier ? <Body muted>{deadline.qualifier.replaceAll('_', ' ').toLowerCase()}</Body> : null}
              </View>
              <StatusPill status={deadline.status} />
            </View>
            <LinkButton label={t('viewDeadline')} onPress={() => router.push({ pathname: '/deadlines/[id]', params: { id: deadline.id } })} />
            {deadline.sourceIds.map((sourceId) => <SourceLine key={sourceId} source={getSource(sourceId)} />)}
          </View>
        ))}
      </Card>

      <SectionTitle>{t('requirements')}</SectionTitle>
      {election.requirements.length === 0 ? <Card><Body>{t('noRequirements')}</Body></Card> : election.requirements.map((requirement) => (
        <Card key={requirement.id}>
          <View style={styles.rowBetween}><Text style={styles.contestTitle}>{requirement.title}</Text><StatusPill status={requirement.status} /></View>
          <Body>{requirement.summary}</Body>
          <LinkButton label={t('viewRequirement')} onPress={() => router.push({ pathname: '/requirements/[id]', params: { id: requirement.id } })} />
          {requirement.sourceIds.map((sourceId) => <SourceLine key={sourceId} source={getSource(sourceId)} />)}
        </Card>
      ))}

      <SectionTitle>{t('contests')}</SectionTitle>
      {election.contests.length === 0 ? <Card><Body>{t('noContests')}</Body></Card> : election.contests.map((contest) => (
        <Card key={contest.id}>
          <Label>{contest.level}</Label>
          <Text style={styles.contestTitle}>{contest.office}</Text>
          {contest.district ? <Body muted>{contest.district}</Body> : null}
          <View style={styles.orderNotice}><Text style={styles.orderNoticeText}>{t(contest.orderStatus === 'OFFICIAL' ? 'officialOrder' : 'alphabeticalOrder')}</Text></View>
          {contest.candidates.map((candidate, index) => (
            <View key={candidate.id} style={styles.candidateRow}>
              <Text style={styles.order}>{candidate.ballotOrder ?? index + 1}</Text>
              <View style={styles.candidateCopy}>
                <Text style={styles.candidateName}>{candidate.name}</Text>
                <Text style={styles.candidateMeta}>{candidate.party ?? t('notProvided')}{candidate.incumbent === true ? ` · ${t('incumbent')}` : ''}</Text>
              </View>
              <LinkButton label={t('view')} onPress={() => router.push({ pathname: '/candidates/[id]', params: { id: candidate.id } })} />
            </View>
          ))}
        </Card>
      ))}

      <SectionTitle>{t('sources')}</SectionTitle>
      <Card>{election.sourceIds.map((sourceId) => <SourceLine key={sourceId} source={getSource(sourceId)} />)}</Card>
    </Screen>
  );
}

function formatDate(value: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone }).format(new Date(value + 'T12:00:00Z'));
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  jurisdiction: { color: palette.inkMuted, fontSize: 13, fontWeight: '700' },
  deadlineBlock: { gap: spacing.md }, rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  deadlineCopy: { flex: 1, gap: spacing.xs }, deadlineName: { color: palette.ink, fontSize: 17, lineHeight: 23, fontWeight: '800' },
  deadlineDate: { color: palette.accent, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  contestTitle: { color: palette.ink, fontSize: 23, lineHeight: 29, fontWeight: '800' },
  orderNotice: { backgroundColor: palette.warningSoft, borderRadius: radius.sm, padding: spacing.sm },
  orderNoticeText: { color: palette.warning, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  candidateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 64, borderTopWidth: 1, borderTopColor: palette.line },
  order: { color: palette.accent, fontSize: 19, fontWeight: '900', width: 22, textAlign: 'center' },
  candidateCopy: { flex: 1, gap: spacing.xs }, candidateName: { color: palette.ink, fontSize: 17, lineHeight: 22, fontWeight: '800' },
  candidateMeta: { color: palette.inkMuted, fontSize: 14, lineHeight: 20 },
});
