import { Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import PageHeader from '../components/common/PageHeader';
import StateBoundary from '../components/common/StateBoundary';
import ScreenMetaDrawer from '../components/common/ScreenMetaDrawer';
import ProjectRegisterLayout from '../layouts/ProjectRegisterLayout';
import ProjectWorkspaceLayout from '../layouts/ProjectWorkspaceLayout';
import SiteContextLayout from '../layouts/SiteContextLayout';
import WorkbenchLayout from '../layouts/WorkbenchLayout';
import RecordDetailLayout from '../layouts/RecordDetailLayout';
import WizardLayout from '../layouts/WizardLayout';
import MasterDetailLayout from '../layouts/MasterDetailLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import PortalLayout from '../layouts/PortalLayout';
import CommandCentreLayout from '../layouts/CommandCentreLayout';
import AIStudioLayout from '../layouts/AIStudioLayout';
import AuthScreen from '../layouts/AuthScreen';
import branches from '../config/branches.json';
import EwpRegisterLayout from '../layouts/EwpRegisterLayout';
import CreateEwpLayout from '../layouts/CreateEwpLayout';
import EwpControlCentreLayout from '../layouts/EwpControlCentreLayout';
import IssueEwoLayout from '../layouts/IssueEwoLayout';
import EwoAcceptanceLayout from '../layouts/EwoAcceptanceLayout';
import InputRegisterLayout from '../layouts/InputRegisterLayout';
import InputReadinessLayout from '../layouts/InputReadinessLayout';
import RfiQueryLayout from '../layouts/RfiQueryLayout';
import DeliverablesRegisterLayout from '../layouts/DeliverablesRegisterLayout';
import DocUploadLayout from '../layouts/DocUploadLayout';
import DocDetailLayout from '../layouts/DocDetailLayout';
import FormalSubmissionLayout from '../layouts/FormalSubmissionLayout';
import ReviewRoutingLayout from '../layouts/ReviewRoutingLayout';
import ReviewWorkspaceLayout from '../layouts/ReviewWorkspaceLayout';
import CommentClosureLayout from '../layouts/CommentClosureLayout';
import ApprovalSignOffLayout from '../layouts/ApprovalSignOffLayout';
import EngineeringReleaseLayout from '../layouts/EngineeringReleaseLayout';
import CurrentReleasedSetLayout from '../layouts/CurrentReleasedSetLayout';
import EbomWorkspaceLayout from '../layouts/EbomWorkspaceLayout';
import BoqWorkspaceLayout from '../layouts/BoqWorkspaceLayout';
import ProcurementPackageLayout from '../layouts/ProcurementPackageLayout';
import TechnicalDeviationLayout from '../layouts/TechnicalDeviationLayout';
import TechnicalCompletionLayout from '../layouts/TechnicalCompletionLayout';
import InvoiceEligibilityLayout from '../layouts/InvoiceEligibilityLayout';
import StandardsDesignBasisLayout from '../layouts/StandardsDesignBasisLayout';
import AuthorityMatrixLayout from '../layouts/AuthorityMatrixLayout';
import TechnicalExceptionsLayout from '../layouts/TechnicalExceptionsLayout';
import AuditEvidenceLayout from '../layouts/AuditEvidenceLayout';
import NotificationsLayout from '../layouts/NotificationsLayout';
import ManagementDashboardLayout from '../layouts/ManagementDashboardLayout';
import AiEvidenceLedgerLayout from '../layouts/AiEvidenceLedgerLayout';
import AccessAdminLayout from '../layouts/AccessAdminLayout';
import ConsultantProfileLayout from '../layouts/ConsultantProfileLayout';
import WorkbenchHomeLayout from '../layouts/WorkbenchHomeLayout';
import MyWorkLayout from '../layouts/MyWorkLayout';
import SiteIntelligenceLayout from '../layouts/SiteIntelligenceLayout';
import SIAStartCaseControlLayout from '../layouts/SIAStartCaseControlLayout';
import SIASitesSurveyLayout from '../layouts/SIASitesSurveyLayout';
import SIAEngineeringAssessmentLayout from '../layouts/SIAEngineeringAssessmentLayout';
import SIADroneGISClimateLayout from '../layouts/SIADroneGISClimateLayout';
import SIAEvidenceAIReadinessLayout from '../layouts/SIAEvidenceAIReadinessLayout';
import SIASEBEWBHandoffLayout from '../layouts/SIASEBEWBHandoffLayout';
import SIAAndroidFieldOpsLayout from '../layouts/SIAAndroidFieldOpsLayout';
import { useNavigate } from 'react-router-dom';


































function chooseLayout(spec) {
 const layout=spec.layout;
 if(spec.id==='GIN-UI-001') return AuthScreen;
 if(spec.id==='GIN-UI-005') return ProjectRegisterLayout;
 if(spec.id==='GIN-UI-006') return ProjectWorkspaceLayout;
 if(spec.id==='GIN-UI-007') return SiteContextLayout;
 if(layout.includes('L10')) return CommandCentreLayout;
 if(layout.includes('L5')) return AIStudioLayout;
 if(layout.includes('L6')) return PortalLayout;
 if(layout.includes('L7')) return MasterDetailLayout;
 if(layout.includes('L4')) return DashboardLayout;
 if(layout.includes('L3')) return WizardLayout;
 if(layout.includes('L1') && !layout.includes('L2')) return WorkbenchLayout;
 if(layout.includes('L1') && layout.includes('L2')) return WorkbenchLayout;
 return RecordDetailLayout;
}
export default function GinfinaScreen({ spec }) {
 const [meta,{open,close}]=useDisclosure(false); const navigate=useNavigate(); const Layout=chooseLayout(spec); const primary=branches.find((b)=>b.screenId===spec.id&&b.kind==='primary');
  if(spec.id==='GIN-UI-001') return <Layout spec={spec}/>;
  if(spec.id==='GIN-UI-002') return <div className="gx1-page"><StateBoundary><ConsultantProfileLayout spec={spec}/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
  if(spec.id==='GIN-UI-003') return <div className="gx1-page"><StateBoundary><SiteIntelligenceLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
  if(spec.id==='GIN-UI-004') return <div className="gx1-page"><StateBoundary><MyWorkLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
  if(spec.id==='GIN-UI-005') return <div className="gx1-page"><StateBoundary><ProjectRegisterLayout spec={spec}/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
  if(spec.id==='GIN-UI-SIA-01') return <div className="gx1-page"><StateBoundary><SIAStartCaseControlLayout spec={spec}/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
  if(spec.id==='GIN-UI-SIA-02') return <div className="gx1-page"><StateBoundary><SIASitesSurveyLayout spec={spec}/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
  if(spec.id==='GIN-UI-SIA-03') return <div className="gx1-page"><StateBoundary><SIAEngineeringAssessmentLayout spec={spec}/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
  if(spec.id==='GIN-UI-SIA-04') return <div className="gx1-page"><StateBoundary><SIADroneGISClimateLayout spec={spec}/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
  if(spec.id==='GIN-UI-SIA-05') return <div className="gx1-page"><StateBoundary><SIAEvidenceAIReadinessLayout spec={spec}/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
  if(spec.id==='GIN-UI-SIA-06') return <div className="gx1-page"><StateBoundary><SIASEBEWBHandoffLayout spec={spec}/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
  if(spec.id==='GIN-UI-SIA-07') return <div className="gx1-page"><StateBoundary><SIAAndroidFieldOpsLayout spec={spec}/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-006') return <div className="gx1-page"><StateBoundary><ProjectWorkspaceLayout spec={spec}/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-007') return <div className="gx1-page"><StateBoundary><SiteContextLayout spec={spec}/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-008') return <div className="gx1-page"><StateBoundary><EwpRegisterLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-009') return <div className="gx1-page"><StateBoundary><CreateEwpLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-010') return <div className="gx1-page"><StateBoundary><EwpControlCentreLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-011') return <div className="gx1-page"><StateBoundary><IssueEwoLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-012') return <div className="gx1-page"><StateBoundary><EwoAcceptanceLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-013') return <div className="gx1-page"><StateBoundary><InputRegisterLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-014') return <div className="gx1-page"><StateBoundary><InputReadinessLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-015') return <div className="gx1-page"><StateBoundary><RfiQueryLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-016') return <div className="gx1-page"><StateBoundary><DeliverablesRegisterLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-017') return <div className="gx1-page"><StateBoundary><DocUploadLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-018') return <div className="gx1-page"><StateBoundary><DocDetailLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-019') return <div className="gx1-page"><StateBoundary><FormalSubmissionLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-020') return <div className="gx1-page"><StateBoundary><ReviewRoutingLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-021') return <div className="gx1-page"><StateBoundary><ReviewWorkspaceLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-022') return <div className="gx1-page"><StateBoundary><CommentClosureLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-023') return <div className="gx1-page"><StateBoundary><ApprovalSignOffLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-024') return <div className="gx1-page"><StateBoundary><EngineeringReleaseLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-025') return <div className="gx1-page"><StateBoundary><CurrentReleasedSetLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-026') return <div className="gx1-page"><StateBoundary><EbomWorkspaceLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-027') return <div className="gx1-page"><StateBoundary><BoqWorkspaceLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-028') return <div className="gx1-page"><StateBoundary><ProcurementPackageLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-029') return <div className="gx1-page"><StateBoundary><TechnicalDeviationLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-030') return <div className="gx1-page"><StateBoundary><TechnicalCompletionLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-031') return <div className="gx1-page"><StateBoundary><InvoiceEligibilityLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-032') return <div className="gx1-page"><StateBoundary><StandardsDesignBasisLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-033') return <div className="gx1-page"><StateBoundary><AuthorityMatrixLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-034') return <div className="gx1-page"><StateBoundary><TechnicalExceptionsLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-035') return <div className="gx1-page"><StateBoundary><AuditEvidenceLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-036') return <div className="gx1-page"><StateBoundary><NotificationsLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-037') return <div className="gx1-page"><StateBoundary><ManagementDashboardLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-038') return <div className="gx1-page"><StateBoundary><AiEvidenceLedgerLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;
 if(spec.id==='GIN-UI-039') return <div className="gx1-page"><StateBoundary><AccessAdminLayout/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/></div>;































 return <div className="gx1-page"><PageHeader spec={spec} onMeta={open}/><StateBoundary><Layout spec={spec}/></StateBoundary><ScreenMetaDrawer spec={spec} opened={meta} onClose={close}/>{primary&&<div className="gx1-sticky-action"><Button fullWidth size="md" color="green" onClick={()=>navigate(primary.route)}>{primary.title}</Button></div>}</div>;
}
