import ArmedConflictArticle from './ArmedConflictArticle';
import GlobalInflationArticle from './GlobalInflationArticle';
import GlobalHungerArticle from './GlobalHungerArticle';
import ForcedDisplacementArticle from './ForcedDisplacementArticle';
import GlobalDebtArticle from './GlobalDebtArticle';
import NewSilkRoadDigitalArticle from './NewSilkRoadDigitalArticle';
import MobileFintechArticle from './MobileFintechArticle';
import RemoteWorkArticle from './RemoteWorkArticle';
import TechRevivesIndigenousLanguageArticle from './TechRevivesIndigenousLanguageArticle';
import GlobalStreamingCultureArticle from './GlobalStreamingCultureArticle';
import MultilateralismVaccinesArticle from './MultilateralismVaccinesArticle';
import HighSeasTreatyArticle from './HighSeasTreatyArticle';
import AIGlobalHealthcareArticle from './AIGlobalHealthcareArticle';

export const articleRegistry = {
  'armed-conflict-world-disorder': {
    Component: ArmedConflictArticle,
    modalClassName: 'projects-article-modal',
  },
  'global-hunger': {
    Component: GlobalHungerArticle,
    modalClassName: 'projects-article-modal global-hunger-article-modal',
  },
  'global-inflation': {
    Component: GlobalInflationArticle,
    modalClassName: 'projects-article-modal global-inflation-article-modal',
  },
  'forced-displacement': {
    Component: ForcedDisplacementArticle,
    modalClassName: 'projects-article-modal forced-displacement-article-modal',
  },
  'global-debt': {
    Component: GlobalDebtArticle,
    modalClassName: 'projects-article-modal global-debt-article-modal',
  },
  'new-silk-road-digital': {
    Component: NewSilkRoadDigitalArticle,
    modalClassName: 'projects-article-modal new-silk-road-digital-article-modal',
  },
  'remote-work-global-opportunities': {
    Component: RemoteWorkArticle,
    modalClassName: 'projects-article-modal remote-work-article-modal',
  },
  'mobile-fintech': {
    Component: MobileFintechArticle,
    modalClassName: 'projects-article-modal mobile-fintech-article-modal',
  },
  'tech-revives-indigenous-language': {
    Component: TechRevivesIndigenousLanguageArticle,
    modalClassName: 'projects-article-modal tech-revives-article-modal',
  },
  'global-streaming-culture': {
    Component: GlobalStreamingCultureArticle,
    modalClassName: 'projects-article-modal global-streaming-culture-article-modal',
  },
  'multilateralism-vaccines': {
    Component: MultilateralismVaccinesArticle,
    modalClassName: 'projects-article-modal multilateralism-vaccines-article-modal',
  },
  'high-seas-treaty': {
    Component: HighSeasTreatyArticle,
    modalClassName: 'projects-article-modal high-seas-treaty-article-modal',
  },
  'ai-global-healthcare': {
    Component: AIGlobalHealthcareArticle,
    modalClassName: 'projects-article-modal ai-global-healthcare-article-modal',
  },
};
