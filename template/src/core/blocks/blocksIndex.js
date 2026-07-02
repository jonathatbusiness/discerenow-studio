import Paragraph from './Paragraph'
import ImgText from './ImgText'
import Video from './Video'
import Accordion from './Accordion'
import Tabs from './Tabs'
import Quiz from './Quiz'
import Callout from './Callout'
import Cards from './Cards'
import FlipCard from './FlipCard'
import ContinueButton from './ContinueButton'
import TextBlock from './TextBlock'
import Columns from './Columns'
import DataTable from './DataTable'
import LearningList from './LearningList'
import ImageCentered from './ImageCentered'
import Process from './Process'

export const blocksMap = {
  paragraph: Paragraph,
  heading: TextBlock,
  subheading: TextBlock,
  paragraphHeading: TextBlock,
  paragraphSubheading: TextBlock,
  columns: Columns,
  table: DataTable,
  numberedList: LearningList,
  checkboxList: LearningList,
  bulletList: LearningList,
  imageCentered: ImageCentered,
  process: Process,
  imgText: ImgText,
  video: Video,
  accordion: Accordion,
  tabs: Tabs,
  quiz: Quiz,
  callout: Callout,
  cards: Cards,
  flipcard: FlipCard,
  continueButton: ContinueButton
}
