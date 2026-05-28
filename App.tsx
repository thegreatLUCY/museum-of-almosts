import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { getArtifactImageSource } from './src/data/artifactLibrary';
import { categories, categoryTint, starterAlmosts } from './src/data/museum';
import { curateAlmost } from './src/lib/curator';
import type { Almost, ArtifactKey, Category } from './src/types';

const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia',
});

const scriptFont = Platform.select({
  ios: 'Marker Felt',
  android: 'casual',
  default: 'Georgia',
});

export default function App() {
  const [almosts, setAlmosts] = useState(starterAlmosts);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [isCataloging, setIsCataloging] = useState(false);
  const [draft, setDraft] = useState('');

  const current = almosts[currentIndex];

  const roomCount = useMemo(() => {
    return almosts.reduce<Record<Category, number>>(
      (counts, item) => {
        counts[item.category] += 1;
        return counts;
      },
      {
        'The Unsaid Wing': 0,
        'The Unmade Wing': 0,
      },
    );
  }, [almosts]);

  function showPrevious() {
    setCurrentIndex((index) => (index === 0 ? almosts.length - 1 : index - 1));
  }

  function showNext() {
    setCurrentIndex((index) => (index === almosts.length - 1 ? 0 : index + 1));
  }

  async function saveAlmost() {
    const trimmed = draft.trim();

    if (!trimmed || isCataloging) {
      return;
    }

    setIsCataloging(true);

    try {
      const curated = await curateAlmost(trimmed);
      setAlmosts((items) => [curated, ...items]);
      setCurrentIndex(0);
      setDraft('');
      setIsAdding(false);
    } finally {
      setIsCataloging(false);
    }
  }

  return (
    <LinearGradient colors={['#f6edde', '#eadcc3']} style={styles.root}>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.paperGlowTop} />
        <View style={styles.paperGlowBottom} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Header />

          <Vitrine
            current={current}
            currentIndex={currentIndex}
            total={almosts.length}
            onPrevious={showPrevious}
            onNext={showNext}
            onJump={setCurrentIndex}
          />

          <LabelCard current={current} currentIndex={currentIndex} />

          <Rooms roomCount={roomCount} currentCategory={current.category} />

          <Pressable style={styles.addButton} onPress={() => setIsAdding(true)}>
            <View style={styles.addButtonIcon}>
              <Text style={styles.addButtonIconText}>+</Text>
            </View>
            <Text style={styles.addButtonText}>add today's almost</Text>
          </Pressable>

          <Text style={styles.footer}>est. for the things that nearly happened</Text>
        </ScrollView>

        <AddModal
          draft={draft}
          isAdding={isAdding}
          isCataloging={isCataloging}
          onChangeDraft={setDraft}
          onClose={() => {
            if (isCataloging) {
              return;
            }

            setDraft('');
            setIsAdding(false);
          }}
          onSave={saveAlmost}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.museumSeal}>
        <Text style={styles.museumSealText}>MOA</Text>
      </View>
      <Text style={styles.kicker}>private collection</Text>
      <Text style={styles.title}>
        Museum of <Text style={styles.titleItalic}>Almosts</Text>
      </Text>
    </View>
  );
}

function Vitrine({
  current,
  currentIndex,
  total,
  onPrevious,
  onNext,
  onJump,
}: {
  current: Almost;
  currentIndex: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  onJump: (index: number) => void;
}) {
  return (
    <View style={styles.stage}>
      <LinearGradient
        colors={['#fdf8ee', '#faf1de']}
        style={styles.displayCase}
      >
        <View style={styles.caseHalo} />
        <View style={styles.caseArch} />
        <View style={styles.caseReflection} />
        <View style={styles.caseFloor} />
        <LinearGradient colors={['#d9b574', '#b8924f']} style={styles.brassPlate}>
          <Text style={styles.brassPlateText}>
            entry {String(currentIndex + 1).padStart(2, '0')}
          </Text>
        </LinearGradient>

        <View style={styles.artifactShelf}>
          <RenderArtifact
            artifact={current.artifact}
            imageSource={
              current.artifactImageUri
                ? { uri: current.artifactImageUri }
                : getArtifactImageSource(current.artifactImageKey)
            }
          />
        </View>

        <LinearGradient
          colors={['#8a6c4a', '#6b5236']}
          style={styles.velvetShelf}
        />
      </LinearGradient>

      <View style={styles.railRow}>
        <Pressable
          accessibilityLabel="Previous exhibit"
          onPress={onPrevious}
          style={styles.navCircle}
        >
          <Text style={styles.navGlyph}>‹</Text>
        </Pressable>

        <View style={styles.rail}>
          <View style={styles.railLine} />
          {Array.from({ length: total }).map((_, index) => (
            <Pressable
              accessibilityLabel={`Exhibit ${index + 1}`}
              key={index}
              onPress={() => onJump(index)}
              style={styles.railTouch}
            >
              <View
                style={[
                  styles.railDot,
                  index === currentIndex && styles.railDotActive,
                ]}
              />
            </Pressable>
          ))}
        </View>

        <Pressable
          accessibilityLabel="Next exhibit"
          onPress={onNext}
          style={styles.navCircle}
        >
          <Text style={styles.navGlyph}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LabelCard({
  current,
  currentIndex,
}: {
  current: Almost;
  currentIndex: number;
}) {
  return (
    <View style={styles.labelCard}>
      <View style={styles.stamp}>
        <Text style={styles.stampText}>✦</Text>
      </View>
      <View style={styles.labelHeader}>
        <Text style={styles.catalogNumber}>
          entry {String(currentIndex + 1).padStart(2, '0')}
        </Text>
        <Text style={styles.date}>{current.date}</Text>
      </View>
      <View style={styles.hairline} />
      <Text style={styles.artifactTitle}>{current.title}</Text>
      <Text style={styles.original}>“{current.original}”</Text>
      <Text style={styles.label}>{current.label}</Text>
      <View style={styles.filingRow}>
        <Text style={styles.filedUnder}>filed under</Text>
        <CategoryPill category={current.category} />
      </View>
    </View>
  );
}

function CategoryPill({
  category,
  small = false,
}: {
  category: Category;
  small?: boolean;
}) {
  const tint = categoryTint[category];

  return (
    <View
      style={[
        styles.categoryPill,
        small && styles.categoryPillSmall,
        { backgroundColor: tint.bg },
      ]}
    >
      <View style={[styles.categoryDot, { backgroundColor: tint.dot }]} />
      <Text
        style={[
          styles.categoryText,
          small && styles.categoryTextSmall,
          { color: tint.ink },
        ]}
      >
        {category}
      </Text>
    </View>
  );
}

function Rooms({
  roomCount,
  currentCategory,
}: {
  roomCount: Record<Category, number>;
  currentCategory: Category;
}) {
  return (
    <View style={styles.roomsSection}>
      <View style={styles.roomsHeader}>
        <Text style={styles.roomsTitle}>the wings of the museum</Text>
        <Text style={styles.roomsMeta}>2 rooms</Text>
      </View>
      <View style={styles.rooms}>
        {categories.map((category) => {
          const tint = categoryTint[category];
          const active = currentCategory === category;

          return (
            <View
              key={category}
              style={[
                styles.room,
                active && {
                  backgroundColor: tint.bg,
                  borderColor: `${tint.dot}66`,
                },
              ]}
            >
              <View style={[styles.roomCountBadge, { backgroundColor: tint.bg }]}>
                <Text style={[styles.roomCount, { color: tint.ink }]}>
                  {roomCount[category]}
                </Text>
              </View>
              <Text style={[styles.roomName, { color: tint.ink }]}>{category}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function AddModal({
  draft,
  isAdding,
  isCataloging,
  onChangeDraft,
  onClose,
  onSave,
}: {
  draft: string;
  isAdding: boolean;
  isCataloging: boolean;
  onChangeDraft: (value: string) => void;
  onClose: () => void;
  onSave: () => void | Promise<void>;
}) {
  const saveDisabled = isCataloging || !draft.trim();

  return (
    <Modal visible={isAdding} animationType="fade" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}
      >
        <Pressable
          disabled={isCataloging}
          style={styles.modalScrim}
          onPress={onClose}
        />
        <View style={styles.modalCard}>
          <View style={styles.dragHandle} />
          <Text style={styles.modalKicker}>· new acquisition ·</Text>
          <Text style={styles.modalTitle}>
            What did you almost <Text style={styles.modalTitleItalic}>do</Text>{' '}
            today?
          </Text>
          <Text style={styles.modalHint}>Write it down before it slips away.</Text>
          <View style={styles.inputWrap}>
            <TextInput
              autoFocus
              editable={!isCataloging}
              multiline
              value={draft}
              onChangeText={onChangeDraft}
              placeholder="I almost..."
              placeholderTextColor="#9c9488"
              style={styles.input}
            />
          </View>
          <View style={styles.modalActions}>
            <Pressable
              disabled={isCataloging}
              onPress={onClose}
              style={[styles.secondaryButton, isCataloging && styles.buttonDisabled]}
            >
              <Text style={styles.secondaryButtonText}>close</Text>
            </Pressable>
            <Pressable
              disabled={saveDisabled}
              onPress={onSave}
              style={[styles.primaryButton, saveDisabled && styles.buttonDisabled]}
            >
              <Text style={styles.primaryButtonText}>
                {isCataloging ? 'cataloging...' : 'catalog it →'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function RenderArtifact({
  artifact,
  imageSource,
}: {
  artifact: ArtifactKey;
  imageSource?: ImageSourcePropType;
}) {
  if (imageSource) {
    return (
      <View style={styles.artifact}>
        <Image
          resizeMode="contain"
          source={imageSource}
          style={styles.generatedArtifactImage}
        />
      </View>
    );
  }

  switch (artifact) {
    case 'envelope':
      return (
        <View style={styles.artifact}>
          <View style={styles.envelope}>
            <View style={styles.envelopeFoldLeft} />
            <View style={styles.envelopeFoldRight} />
            <View style={styles.envelopeSeal} />
          </View>
        </View>
      );
    case 'suitcase':
      return (
        <View style={styles.artifact}>
          <View style={styles.suitcaseHandle} />
          <View style={styles.suitcase}>
            <View style={styles.suitcaseBand} />
            <View style={styles.suitcaseDotLeft} />
            <View style={styles.suitcaseDotRight} />
          </View>
        </View>
      );
    case 'moonJar':
      return (
        <View style={styles.artifact}>
          <View style={styles.jarLid} />
          <View style={styles.jar}>
            <View style={styles.moon} />
            <View style={styles.jarShine} />
          </View>
        </View>
      );
    case 'paperPlane':
      return (
        <View style={styles.artifact}>
          <View style={styles.paperPlane}>
            <View style={styles.paperPlaneFold} />
          </View>
        </View>
      );
    case 'teacup':
      return (
        <View style={styles.artifact}>
          <View style={styles.steamOne} />
          <View style={styles.steamTwo} />
          <View style={styles.teacup}>
            <View style={styles.teacupHandle} />
          </View>
          <View style={styles.saucer} />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  paperGlowTop: {
    position: 'absolute',
    top: 38,
    left: -130,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(181, 112, 90, 0.1)',
  },
  paperGlowBottom: {
    position: 'absolute',
    right: -140,
    bottom: -20,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(126, 149, 128, 0.15)',
  },
  content: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
  },
  museumSeal: {
    width: 58,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#2d251d',
    borderWidth: 1,
    borderColor: '#b8924f',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2a1b0e',
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 2,
  },
  museumSealText: {
    color: '#e4c27c',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  kicker: {
    marginTop: 10,
    color: '#b8924f',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 6,
    color: '#2a221a',
    fontFamily: serifFont,
    fontSize: 34,
    fontWeight: '500',
    lineHeight: 38,
    textAlign: 'center',
  },
  titleItalic: {
    color: '#b5705a',
    fontFamily: serifFont,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  stage: {
    marginTop: 16,
  },
  displayCase: {
    minHeight: 330,
    borderTopLeftRadius: 150,
    borderTopRightRadius: 150,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    borderWidth: 1.5,
    borderColor: '#e5d6bd',
    alignItems: 'center',
    paddingTop: 54,
    paddingBottom: 28,
    overflow: 'hidden',
    shadowColor: '#503c28',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 20 },
    shadowRadius: 28,
    elevation: 6,
  },
  caseHalo: {
    position: 'absolute',
    top: 72,
    width: 248,
    height: 214,
    borderRadius: 124,
    backgroundColor: 'rgba(226, 236, 223, 0.94)',
  },
  caseArch: {
    position: 'absolute',
    top: 18,
    width: '82%',
    height: 250,
    borderTopLeftRadius: 132,
    borderTopRightRadius: 132,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(126, 99, 70, 0.16)',
  },
  caseFloor: {
    position: 'absolute',
    bottom: 58,
    width: '84%',
    height: 1,
    backgroundColor: 'rgba(126, 99, 70, 0.22)',
  },
  caseReflection: {
    position: 'absolute',
    right: 42,
    top: 10,
    width: 44,
    height: 190,
    borderRadius: 31,
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
    transform: [{ rotate: '18deg' }],
  },
  brassPlate: {
    position: 'absolute',
    top: 22,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  brassPlateText: {
    color: '#3a2a14',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  artifactShelf: {
    marginTop: 22,
    width: 196,
    height: 196,
    borderRadius: 98,
    backgroundColor: '#e8f0e7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#786450',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  velvetShelf: {
    marginTop: 18,
    width: '62%',
    height: 8,
    borderRadius: 4,
  },
  railRow: {
    marginTop: 14,
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fbf3e3',
    borderWidth: 1,
    borderColor: 'rgba(140, 120, 90, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navGlyph: {
    color: '#5f513f',
    fontSize: 25,
    lineHeight: 27,
  },
  rail: {
    flex: 1,
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  railLine: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 1,
    backgroundColor: 'rgba(140, 120, 90, 0.28)',
  },
  railTouch: {
    flex: 1,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#cfc2ad',
  },
  railDotActive: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#b8924f',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#503214',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  labelCard: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: '#fff8ea',
    borderWidth: 1.5,
    borderColor: '#d9c7a7',
    borderLeftWidth: 6,
    borderLeftColor: '#b5705a',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    shadowColor: '#3c2814',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 2,
  },
  stamp: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2d251d',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2a1b0e',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  stampText: {
    color: '#e4c27c',
    fontSize: 14,
    fontWeight: '800',
  },
  labelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catalogNumber: {
    color: '#b8924f',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  date: {
    color: '#b8924f',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  hairline: {
    height: 1,
    backgroundColor: 'rgba(140, 100, 60, 0.18)',
    marginTop: 10,
    marginBottom: 12,
  },
  artifactTitle: {
    color: '#2a221a',
    fontFamily: serifFont,
    fontSize: 25,
    fontWeight: '500',
    lineHeight: 30,
    paddingRight: 34,
  },
  original: {
    marginTop: 10,
    color: '#7b6652',
    fontFamily: scriptFont,
    fontSize: 21,
    lineHeight: 27,
  },
  label: {
    marginTop: 12,
    color: '#4b3f33',
    fontFamily: serifFont,
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 23,
  },
  filingRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryPillSmall: {
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  categoryDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    opacity: 0.58,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  categoryTextSmall: {
    fontSize: 10.5,
  },
  filedUnder: {
    color: '#b8924f',
    fontSize: 11,
    letterSpacing: 0.6,
  },
  roomsSection: {
    marginTop: 16,
  },
  roomsHeader: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  roomsTitle: {
    color: '#7d7062',
    fontFamily: serifFont,
    fontSize: 14,
    fontStyle: 'italic',
  },
  roomsMeta: {
    color: '#b8924f',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  rooms: {
    flexDirection: 'row',
    gap: 8,
  },
  room: {
    flex: 1,
    minHeight: 78,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 248, 234, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(126, 99, 70, 0.18)',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  roomCountBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomCount: {
    fontFamily: serifFont,
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 22,
  },
  roomName: {
    marginTop: 8,
    color: '#4b3f33',
    fontFamily: serifFont,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 17,
  },
  addButton: {
    marginTop: 18,
    height: 58,
    borderRadius: 10,
    backgroundColor: '#241e18',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#281e14',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 4,
  },
  addButtonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#b5705a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonIconText: {
    color: '#fdf6e9',
    fontSize: 17,
    lineHeight: 20,
  },
  addButtonText: {
    color: '#fdf6e9',
    fontFamily: serifFont,
    fontSize: 17,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 22,
    color: '#7d7062',
    fontFamily: serifFont,
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(34, 29, 24, 0.42)',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#fdf6e9',
    borderTopWidth: 1,
    borderColor: '#ece1cb',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 28,
    shadowColor: '#281e14',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: -10 },
    shadowRadius: 26,
    elevation: 8,
  },
  dragHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d9cdb7',
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalKicker: {
    color: '#b8924f',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  modalTitle: {
    marginTop: 8,
    color: '#2a221a',
    fontFamily: serifFont,
    fontSize: 26,
    fontWeight: '500',
    lineHeight: 31,
  },
  modalTitleItalic: {
    color: '#b5705a',
    fontStyle: 'italic',
  },
  modalHint: {
    marginTop: 4,
    marginBottom: 14,
    color: '#7d7062',
    fontFamily: serifFont,
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputWrap: {
    borderRadius: 18,
    backgroundColor: '#fbf2df',
    borderWidth: 1.5,
    borderColor: '#d9a85a',
    shadowColor: '#d9a85a',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    minHeight: 120,
    color: '#2a221a',
    fontFamily: scriptFont,
    fontSize: 22,
    lineHeight: 30,
    textAlignVertical: 'top',
  },
  modalActions: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f4ead6',
    borderWidth: 1,
    borderColor: '#e3d6bd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#7d7062',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.52,
  },
  primaryButton: {
    flex: 1.4,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#241e18',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#281e14',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fdf6e9',
    fontFamily: serifFont,
    fontSize: 16,
    fontStyle: 'italic',
  },
  artifact: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatedArtifactImage: {
    width: 148,
    height: 148,
  },
  envelope: {
    width: 100,
    height: 68,
    borderRadius: 8,
    backgroundColor: '#f0d2a8',
    borderWidth: 3,
    borderColor: '#2a221a',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-4deg' }],
  },
  envelopeFoldLeft: {
    position: 'absolute',
    left: 8,
    top: 16,
    width: 48,
    height: 3,
    backgroundColor: '#2a221a',
    transform: [{ rotate: '37deg' }],
  },
  envelopeFoldRight: {
    position: 'absolute',
    right: 8,
    top: 16,
    width: 48,
    height: 3,
    backgroundColor: '#2a221a',
    transform: [{ rotate: '-37deg' }],
  },
  envelopeSeal: {
    position: 'absolute',
    bottom: 9,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#b5705a',
    borderWidth: 2.5,
    borderColor: '#2a221a',
  },
  suitcaseHandle: {
    width: 34,
    height: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 3.5,
    borderBottomWidth: 0,
    borderColor: '#2a221a',
    marginBottom: -2,
  },
  suitcase: {
    width: 104,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#8da894',
    borderWidth: 3.5,
    borderColor: '#2a221a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suitcaseBand: {
    width: 18,
    height: '100%',
    backgroundColor: '#d7b36a',
    borderLeftWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: '#2a221a',
  },
  suitcaseDotLeft: {
    position: 'absolute',
    left: 16,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2a221a',
  },
  suitcaseDotRight: {
    position: 'absolute',
    right: 16,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2a221a',
  },
  jarLid: {
    width: 48,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#8c6c4c',
    borderWidth: 3,
    borderColor: '#2a221a',
    marginBottom: -3,
    zIndex: 2,
  },
  jar: {
    width: 72,
    height: 84,
    borderRadius: 20,
    backgroundColor: '#dce8ea',
    borderWidth: 3,
    borderColor: '#2a221a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3d87b',
    borderWidth: 2,
    borderColor: 'rgba(232, 197, 96, 0.7)',
  },
  jarShine: {
    position: 'absolute',
    left: 14,
    top: 16,
    width: 5,
    height: 26,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  paperPlane: {
    width: 0,
    height: 0,
    borderTopWidth: 42,
    borderBottomWidth: 42,
    borderLeftWidth: 100,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#e8edf2',
    transform: [{ rotate: '-12deg' }],
  },
  paperPlaneFold: {
    position: 'absolute',
    left: -82,
    top: -2,
    width: 62,
    height: 4,
    backgroundColor: '#2a221a',
    transform: [{ rotate: '-25deg' }],
  },
  steamOne: {
    width: 4,
    height: 28,
    borderRadius: 2,
    backgroundColor: 'rgba(42, 34, 26, 0.28)',
    transform: [{ rotate: '16deg' }],
    marginBottom: -2,
    marginLeft: -24,
  },
  steamTwo: {
    width: 4,
    height: 28,
    borderRadius: 2,
    backgroundColor: 'rgba(42, 34, 26, 0.22)',
    transform: [{ rotate: '-14deg' }],
    marginBottom: -4,
    marginLeft: 22,
  },
  teacup: {
    width: 82,
    height: 54,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    backgroundColor: '#d7b36a',
    borderWidth: 3.5,
    borderColor: '#2a221a',
  },
  teacupHandle: {
    position: 'absolute',
    right: -28,
    top: 8,
    width: 34,
    height: 32,
    borderRadius: 17,
    borderWidth: 3.5,
    borderColor: '#2a221a',
    backgroundColor: 'transparent',
  },
  saucer: {
    marginTop: -4,
    width: 104,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#c9b59b',
    borderWidth: 3,
    borderColor: '#2a221a',
  },
});
