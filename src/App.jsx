import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { savePortalData, subscribePortalData, uploadPortalImage } from './lib/portalStorage';
import { 
  Building, 
  FileText, 
  Sliders, 
  Send, 
  Layers, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  DollarSign, 
  Globe, 
  Mail, 
  MessageSquare, 
  HelpCircle, 
  ArrowRight,
  Clipboard,
  ExternalLink,
  Eye,
  Settings,
  Lock,
  Unlock,
  LogOut,
  ChevronRight,
  Search,
  Filter,
  Check,
  TrendingUp,
  Download,
  Database,
  Trash2,
  Upload,
  Image as ImageIcon,
  Calendar,
  Info
} from 'lucide-react';

// SPMS 프리미엄 브랜드 벡터 로고 컴포넌트
const SpmsLogo = ({ className = "h-8" }) => (
  <svg className={className} viewBox="0 0 420 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    {/* S */}
    <path d="M10 25C10 16.7157 16.7157 10 25 10H85C90.5228 10 95 14.4772 95 20V25C95 27.7614 92.7614 30 90 30H30V45C30 47.7614 32.2386 50 35 50H80C88.2843 50 95 56.7157 95 65V80C95 88.2843 88.2843 95 80 95H15C9.47715 95 5 90.5228 5 85V80C5 77.2386 7.23858 75 10 75H70V60C70 57.2386 67.7614 55 65 55H20C11.7157 55 5 48.2843 5 40V25H10Z" fill="#E52E3A"/>
    {/* P */}
    <path d="M110 10H175C186.046 10 195 18.9543 195 30V45C195 56.0457 186.046 65 175 65H135V90C135 92.7614 132.761 95 130 95H115C112.239 95 110 92.7614 110 90V10ZM135 30V45H170C172.761 45 175 42.7614 175 40V35C175 32.2386 172.761 30 170 30H135Z" fill="#E52E3A"/>
    {/* M */}
    <path d="M210 15C210 12.2386 212.239 10 215 10H233C235.105 10 237.032 11.3194 237.8 13.28L255 57.28L272.2 13.28C272.968 11.3194 274.895 10 277 10H295C297.761 10 300 12.2386 300 15V90C300 92.7614 297.761 95 295 95H277C274.239 95 272 92.7614 272 90V45L258.4 79.5C257.2 82.5 252.8 82.5 251.6 79.5L238 45V90C238 92.7614 235.761 95 233 95H215C212.239 95 210 92.7614 210 90V15Z" fill="#E52E3A" />
    {/* S */}
    <path d="M315 25C315 16.7157 321.716 10 330 10H390C395.523 10 400 14.4772 400 20V25C400 27.7614 397.761 30 395 30H335V45C335 47.7614 337.239 50 340 50H385C393.284 50 400 56.7157 400 65V80C400 88.2843 393.284 95 385 95H320C314.477 95 310 90.5228 310 85V80C310 77.2386 312.239 75 315 75H375V60C375 57.2386 372.761 55 370 55H325C316.716 55 310 48.2843 310 40V25H315Z" fill="#E52E3A"/>
  </svg>
);

const INITIAL_VENDORS = [];
const INITIAL_REQUESTS = [];

const getNextVendorId = (vendorList) => {
  const maxId = vendorList.reduce((max, vendor) => {
    const numericId = Number(String(vendor.id || '').replace('V', ''));
    return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
  }, 0);
  return `V${String(maxId + 1).padStart(3, '0')}`;
};

const getNextRequestId = (requestList) => {
  const maxId = requestList.reduce((max, request) => {
    const numericId = Number(String(request.id || '').split('-').pop());
    return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
  }, 0);
  return `REQ-2026-${String(maxId + 1).padStart(3, '0')}`;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('client');
  const [adminSubTab, setAdminSubTab] = useState('workspace');
  
  const [vendors, setVendors] = useState(INITIAL_VENDORS);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [vendorForm, setVendorForm] = useState({
    companyName: '',
    address: '',
    manager: '',
    email: '',
    wechat: '',
    kakao: '',
    phone: '',
    registeredAt: new Date().toISOString().split('T')[0]
  });
  
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [hasImageLink, setHasImageLink] = useState(true); 
  const [uploadedImages, setUploadedImages] = useState([]); 
  const [productForm, setProductForm] = useState({
    productName: '',
    specs: '',
    quantity: 100,
    imageUrl: '', 
    refUrl: '',
    requestType: 'sourcing',
    tradeTerm: 'fob_spms_clearance' // 기본값: 수입서비스 대행 조건
  });

  // 관리자 B2B 무역 원가 및 관부세 핵심 통제 변수
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminCostCNY, setAdminCostCNY] = useState(50); // 위안화(CNY) 기준 중국 공장 공급가
  const [exchangeRateCNY, setExchangeRateCNY] = useState(191.5); // 중국 네이버 고시 환율 세팅
  
  // 신규 요청 수수료/비용 슬라이더 변수 구성
  const [adminMargin, setAdminMargin] = useState(15); // SPMS 대행 마진율 (0 ~ 30%, 기본 15%)
  const [tariffRate, setTariffRate] = useState(8); // 상품별 관세율 (0 ~ 20%, 기본 8%)
  const [chinaFobExportRate, setChinaFobExportRate] = useState(5); // 중국 FOB 수출비용율 (0 ~ 15%, 기본 5%)
  const [koreaImportRate, setKoreaImportRate] = useState(5); // 한국 수입 비용율 (0 ~ 15%, 기본 5%)
  const [isSmallVolumeDirectPay, setIsSmallVolumeDirectPay] = useState(false); // 소량 주문 수출입 비용 바이어 직납 토글
  const [leadTimeWeeks, setLeadTimeWeeks] = useState(4); // 생산 납기 딜리버리 기간 설정 (1주 ~ 12주, 기본 4주)

  const [generatedQuote, setGeneratedQuote] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const quotePdfRef = useRef(null);

  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [dbStatusFilter, setDbStatusFilter] = useState('all');

  const showNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const persistPortalData = (nextVendors, nextRequests) => {
    savePortalData({ vendors: nextVendors, requests: nextRequests }).catch((error) => {
      console.warn('Portal data save failed.', error);
      showNotification('데이터 저장 중 오류가 발생했습니다. Firebase 설정을 확인해 주세요.', 'error');
    });
  };

  useEffect(() => {
    const unsubscribe = subscribePortalData(
      ({ vendors: storedVendors, requests: storedRequests }) => {
        setVendors(storedVendors);
        setRequests(storedRequests);
        setSelectedVendorId((currentVendorId) =>
          storedVendors.some((vendor) => vendor.id === currentVendorId) ? currentVendorId : ''
        );
        setSelectedRequest((currentRequest) =>
          currentRequest
            ? storedRequests.find((request) => request.id === currentRequest.id) || null
            : null
        );
      },
      () => {
        showNotification('실시간 데이터 동기화 연결을 확인해 주세요.', 'error');
      }
    );

    return unsubscribe;
  }, []);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + uploadedImages.length > 3) {
      showNotification('제품 사진은 최대 3장까지만 직접 업로드할 수 있습니다.', 'error');
      return;
    }

    try {
      const imageUrls = await Promise.all(files.map((file) => uploadPortalImage(file)));
      setUploadedImages(prev => [...prev, ...imageUrls]);
      showNotification(`${files.length}장의 사진이 정상적으로 등록되었습니다.`);
    } catch (error) {
      console.warn('Image upload failed.', error);
      showNotification('사진 저장 중 오류가 발생했습니다. Firebase Storage 설정을 확인해 주세요.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const removeUploadedImage = (indexToRemove) => {
    setUploadedImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    showNotification('선택하신 사진이 업로드 대기열에서 제외되었습니다.');
  };

  const handleRegisterVendor = (e) => {
    e.preventDefault();
    const { companyName, address, manager, email, phone, kakao, wechat, registeredAt } = vendorForm;

    if (!companyName.trim()) {
      showNotification('회사명(상호)을 반드시 기입해 주세요.', 'error');
      return;
    }
    if (!manager.trim()) {
      showNotification('담당자 성함을 반드시 기입해 주세요.', 'error');
      return;
    }
    if (!registeredAt) {
      showNotification('의뢰 요청날짜를 선택해 주세요.', 'error');
      return;
    }
    if (!address.trim()) {
      showNotification('회사 주소를 반드시 기입해 주세요.', 'error');
      return;
    }
    if (!email.trim()) {
      showNotification('이메일 주소를 형식에 맞게 기입해 주세요.', 'error');
      return;
    }
    if (!phone.trim()) {
      showNotification('연락처(전화번호)를 반드시 기입해 주세요.', 'error');
      return;
    }
    if (!kakao.trim() && !wechat.trim()) {
      showNotification('신속한 피드백을 위해 카카오톡 ID 혹은 위챗 ID 중 최소 하나는 반드시 기입하셔야 합니다.', 'error');
      return;
    }
    
    const newVendorId = getNextVendorId(vendors);
    const newVendor = {
      id: newVendorId,
      companyName,
      address,
      manager,
      email,
      phone,
      kakao,
      wechat,
      registeredAt
    };
    
    const nextVendors = [...vendors, newVendor];
    setVendors(nextVendors);
    persistPortalData(nextVendors, requests);
    setSelectedVendorId(newVendorId); 
    setVendorForm({ 
      companyName: '', 
      address: '', 
      manager: '', 
      email: '', 
      wechat: '', 
      kakao: '', 
      phone: '',
      registeredAt: new Date().toISOString().split('T')[0]
    });
    showNotification(`[${newVendor.companyName}] 바이어 정보 등록이 완료되었습니다. STEP 2의 의뢰 바이어로 자동 연동되었습니다.`);
  };

  const handleRequestProduct = (e) => {
    e.preventDefault();
    if (!selectedVendorId) {
      showNotification('STEP 1 단계를 완료하여 의뢰 기업 정보를 먼저 등록해 주세요.', 'error');
      return;
    }
    if (!productForm.productName.trim() || !productForm.quantity) {
      showNotification('의뢰 대상 상품명과 희망 필요 수량은 필수 항목입니다.', 'error');
      return;
    }
    if (!productForm.specs || productForm.specs.trim().length < 5) {
      showNotification('상세 제품 사양 및 가이드라인을 최소 5자 이상 상세히 기재해 주세요.', 'error');
      return;
    }

    if (hasImageLink && (!productForm.imageUrl || !productForm.imageUrl.trim())) {
      showNotification('네이버/쿠팡 판매 링크를 등록하시거나, 하단 이미지 직접 첨부 방식을 활성화해 주세요.', 'error');
      return;
    }
    if (!hasImageLink && uploadedImages.length === 0) {
      showNotification('참고 제품 사진을 1장 이상 필수로 직접 첨부해 주세요.', 'error');
      return;
    }

    const newReqId = getNextRequestId(requests);
    const today = new Date().toISOString().split('T')[0];

    const newRequest = {
      id: newReqId,
      vendorId: selectedVendorId,
      ...productForm,
      quantity: Number(productForm.quantity),
      status: 'pending',
      createdAt: today,
      quote: null,
      localImages: hasImageLink ? null : [...uploadedImages]
    };

    const nextRequests = [newRequest, ...requests];
    setRequests(nextRequests);
    persistPortalData(vendors, nextRequests);
    setProductForm({
      productName: '',
      specs: '',
      quantity: 100,
      imageUrl: '',
      refUrl: '',
      requestType: productForm.requestType,
      tradeTerm: 'fob_spms_clearance'
    });
    setUploadedImages([]); 
    showNotification('1차 글로벌 소싱 및 제작 기획 요청이 접수되었습니다. 관리자 승인 대기 단계로 인입됩니다.');
  };

  // 관리자용: 바이어 의뢰 카드 영구 삭제 처리 핸들러
  const handleDeleteRequest = (reqId, e) => {
    e?.stopPropagation(); // 카드 선택 클릭 이벤트 전파 차단
    
    // 해당 의뢰 삭제
    const nextRequests = requests.filter(req => req.id !== reqId);
    setRequests(nextRequests);
    persistPortalData(vendors, nextRequests);
    
    // 만약 현재 작업 패널에 올라와 있는 의뢰를 삭제했다면, 상세 패널을 닫아줍니다.
    if (selectedRequest && selectedRequest.id === reqId) {
      setSelectedRequest(null);
    }
    
    showNotification('선택하신 바이어 의뢰가 데이터베이스에서 영구적으로 삭제되었습니다.', 'success');
  };

  useEffect(() => {
    if (selectedRequest) {
      if (selectedRequest.requestType === 'sourcing') {
        setAdminMargin(10);
      } else {
        setAdminMargin(20);
      }
    }
  }, [selectedRequest]);

  // 팩트/요구조건 기반 실무 한화 정밀 연산 로직 (FOB 조건 이원화 연동)
  const calculatePricing = () => {
    const quantity = selectedRequest ? selectedRequest.quantity : 1;
    const isFobBuyer = selectedRequest?.tradeTerm === 'fob_buyer_clearance';
    
    // 1. 중국돈 공장 공급가 ¥ (CNY)을 한국 네이버 환율로 곱해서 기본 한화 원가 산정
    const costInKRW = adminCostCNY * exchangeRateCNY;
    
    // 2. 중국 수출 비용 및 한국 수입 비용 요율 계산
    const chinaExportCost = costInKRW * (chinaFobExportRate / 100);
    
    // [실무 조건 반영] 1번 FOB 바이어 직접 통관 조건일 경우 한국 수입비용은 완전히 제외(0원)
    const koreaImportCost = isFobBuyer ? 0 : (costInKRW * (koreaImportRate / 100));
    
    // [핵심] 수출입 비용 환율 적용 원가에 합산 연동 반영
    let appliedCostKRW = costInKRW;
    if (isFobBuyer) {
      // 1번 조건: 순수 FOB Shanghai 인도 조건 (공장 원가 + 중국 내 수출 및 항구 FOB 제비용 가산)
      appliedCostKRW = costInKRW + chinaExportCost;
    } else if (!isSmallVolumeDirectPay) {
      // 2번 조건: 완스톱 수입 대행 조건 (공장원가 + 중국 수출비 + 한국 수입비용 일괄 적용)
      appliedCostKRW = costInKRW + chinaExportCost + koreaImportCost;
    }
    
    // 3. 공급단가 = 수출입 비용이 반영된 환율 적용원가 * (1 + 대행 마진율)
    const finalUnitPrice = Math.round(appliedCostKRW * (1 + adminMargin / 100));
    
    // 4. 공급가액 총합 = 공급단가 * 수량
    const supplyTotalKRW = finalUnitPrice * quantity;
    
    // 5. 상품별 관세율 계산 (1번 조건인 경우 한국 관세는 견적서 비대상/₩0원 처리)
    const tariffCostUnit = isFobBuyer ? 0 : (costInKRW * (tariffRate / 100));
    const tariffTotalKRW = (isSmallVolumeDirectPay || isFobBuyer) ? 0 : Math.round(tariffCostUnit * quantity);

    // 6. 최종 청구 합계액 = 공급가액 총합 + 관세액 총합
    const finalTotalKRW = supplyTotalKRW + tariffTotalKRW;

    // 7. 실무 추가: 선금 계약금(30%) 및 정산 인도금(70%) 정확한 원화 정밀 계산
    const depositKRW = Math.round(finalTotalKRW * 0.3);
    const balanceKRW = finalTotalKRW - depositKRW; // 정확한 70% 잔금 (단수 차액 방지 보정)
    
    return {
      costInKRW: Math.round(costInKRW),
      chinaExportCost: Math.round(chinaExportCost),
      koreaImportCost: Math.round(koreaImportCost),
      appliedCostKRW: Math.round(appliedCostKRW),
      tariffCostUnit: Math.round(tariffCostUnit),
      tariffTotalKRW,
      finalUnitPrice,
      supplyTotalKRW,
      finalTotalKRW,
      depositKRW,
      balanceKRW
    };
  };

  const pricing = calculatePricing();

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword.trim() === 'spms0612!!') {
      setIsAdminAuthenticated(true);
      setPasswordError('');
      showNotification('관리자 자격 인증에 성공하여 통제 데스크를 개방합니다.', 'success');
    } else {
      setPasswordError('비밀번호가 올바르지 않습니다.');
      showNotification('관리자 패스워드를 확인해 주세요.', 'error');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminPassword('');
    setSelectedRequest(null);
    showNotification('안전을 위해 관리자 세션이 완전히 차단되었습니다.');
  };

  const handleGenerateQuote = () => {
    if (!selectedRequest) return;

    const vendor = vendors.find(v => v.id === selectedRequest.vendorId);
    const newQuote = {
      quoteId: `QT-${selectedRequest.id.replace('REQ-', '')}`,
      vendorName: vendor ? vendor.companyName : '미등록 바이어',
      manager: vendor ? vendor.manager : '미등록 담당자',
      email: vendor ? vendor.email : '',
      wechat: vendor ? vendor.wechat : '',
      kakao: vendor ? vendor.kakao : '',
      phone: vendor ? vendor.phone : '',
      productName: selectedRequest.productName,
      quantity: selectedRequest.quantity,
      requestType: selectedRequest.requestType,
      tradeTerm: selectedRequest.tradeTerm, // 인도 조건 정보 동기화
      
      // 원가 정보 바인딩
      costCNY: adminCostCNY,
      exchangeRate: exchangeRateCNY,
      costInKRW: pricing.costInKRW,
      chinaFobExportRate,
      chinaFobExportCost: pricing.chinaExportCost,
      koreaImportRate: selectedRequest.tradeTerm === 'fob_buyer_clearance' ? 0 : koreaImportRate,
      koreaImportCost: pricing.koreaImportCost,
      appliedCostKRW: pricing.appliedCostKRW,
      marginRate: adminMargin,
      unitPrice: pricing.finalUnitPrice,
      supplyTotal: pricing.supplyTotalKRW,
      
      // 관세 정보 바인딩
      tariffRate: selectedRequest.tradeTerm === 'fob_buyer_clearance' ? 0 : tariffRate,
      tariffTotal: pricing.tariffTotalKRW,
      isSmallVolumeDirectPay, 
      
      // 납기 및 결제 분할 연산 정보 바인딩 (30% 선금 / 70% 잔금)
      leadTimeWeeks,
      depositKRW: pricing.depositKRW,
      balanceKRW: pricing.balanceKRW,

      // 실무 요건 추가: 바이어 요청 스펙 및 썸네일/로컬이미지 목록도 견적서 본장에 동기 연동
      specs: selectedRequest.specs,
      imageUrl: selectedRequest.imageUrl,
      localImages: selectedRequest.localImages,
      
      // 최종 합계액
      totalPrice: pricing.finalTotalKRW,
      notes: "수출입 물류 대행 부가세 별도 적용 가격"
    };

    setGeneratedQuote(newQuote);
    setShowQuoteModal(true);

    const nextRequests = requests.map(req => {
      if (req.id === selectedRequest.id) {
        return { ...req, status: 'quoted', quote: newQuote };
      }
      return req;
    });
    setRequests(nextRequests);
    setSelectedRequest(nextRequests.find(req => req.id === selectedRequest.id) || null);
    persistPortalData(vendors, nextRequests);
  };

  const handleSendQuote = (method) => {
    if (!generatedQuote) return;

    if (method === 'email') {
      showNotification(`바이어 등록 메일 계정으로 고해상도 PDF 견적서 전송을 승인했습니다.`);
    } else if (method === 'wechat') {
      showNotification(`위챗 ID [${generatedQuote.wechat}] 메신저로 대행 견적 카드 및 상세 청구 링크가 즉시 전달되었습니다.`);
    } else if (method === 'kakao') {
      showNotification(`카카오톡 ID [${generatedQuote.kakao}]로 스마트 알림톡 견적 리포트 발송이 완료되었습니다.`);
    }
    setShowQuoteModal(false);
    setSelectedRequest(null);
  };

  const handleUpdateStatus = (reqId, newStatus) => {
    const targetRequest = requests.find(req => req.id === reqId);
    const nextRequests = requests.map(req => {
      if (req.id === reqId) {
        return { ...req, status: newStatus };
      }
      return req;
    });
    setRequests(nextRequests);
    setSelectedRequest(currentRequest =>
      currentRequest?.id === reqId ? nextRequests.find(req => req.id === reqId) || null : currentRequest
    );
    persistPortalData(vendors, nextRequests);
    showNotification(`진행 상태 코드가 [${getStatusLabel(newStatus, targetRequest?.requestType || 'sourcing')}] 단계로 변경되었습니다.`);
  };

  const getStatusLabel = (status, requestType) => {
    switch (status) {
      case 'pending': return '접수 완료';
      case 'processing': return requestType === 'sourcing' ? '소싱 진행중' : '제작 기획중';
      case 'quoted': return '제안서 제공 완료';
      case 'success': return '발주 계약 성공 🎉';
      default: return '미확인 상태';
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'pending': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'processing': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'quoted': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'success': return 'bg-emerald-100 text-emerald-800 border-emerald-200 font-extrabold';
      default: return 'bg-slate-100 text-slate-400';
    }
  };

  const handleCopyToClipboard = () => {
    if (!generatedQuote) return;
    
    let directPayText = '';
    if (generatedQuote.tradeTerm === 'fob_buyer_clearance') {
      directPayText = `인도 조건: 상해 SPMS FOB 상차 인도 (바이어 자가 수입 통관 조건)\n관세, 한국 부가세 및 한국 내 수입 제비용 전액 제외 (₩0원)`;
    } else if (generatedQuote.isSmallVolumeDirectPay) {
      directPayText = `수출입 비용 (중국 수출 ${generatedQuote.chinaFobExportRate}% / 한국 수입 ${generatedQuote.koreaImportRate}%): 소량 발주 조건으로 바이어 직접 부담 (청구서 제외)\n관세액 (${generatedQuote.tariffRate}%): 바이어 세관 직접 납부 조건`;
    } else {
      directPayText = `중국 FOB 수출비용 (${generatedQuote.chinaFobExportRate}%): ₩${(generatedQuote.chinaFobExportCost * generatedQuote.quantity).toLocaleString()}원\n한국 수입비용 (${generatedQuote.koreaImportRate}%): ₩${(generatedQuote.koreaImportCost * generatedQuote.quantity).toLocaleString()}원\n관세액 (${generatedQuote.tariffRate}%): ₩${generatedQuote.tariffTotal.toLocaleString()}원`;
    }

    const textToCopy = `[SPMS B2B 해외 소싱 공급가 산정 안내 - ${generatedQuote.vendorName}]
품명: ${generatedQuote.productName}
수량: ${generatedQuote.quantity.toLocaleString()}개
구분: ${generatedQuote.requestType === 'sourcing' ? '일반 기성 수입 소싱' : '디자인 기획 커스텀 OEM'}
인도 조건: ${generatedQuote.tradeTerm === 'fob_buyer_clearance' ? 'FOB 상해 항구 인도 (바이어 직접 수입통관)' : 'FOB 상해 ➔ 한국 SPMS 수입서비스 일괄대행'}

[세부 정밀 계산 명세]
중국 공장 원가: ¥${generatedQuote.costCNY.toLocaleString()} CNY
중국 네이버 적용 환율: ${generatedQuote.exchangeRate}원 (CNY ➔ KRW)
원화 환산 제조원가(개당): ₩${generatedQuote.costInKRW.toLocaleString()}원
적용 마진율: ${generatedQuote.marginRate}% (최종 공급단가 ₩${generatedQuote.unitPrice.toLocaleString()}원)
기성 공급 총액: ₩${generatedQuote.supplyTotal.toLocaleString()}원

[수출입 및 관세 명세]
${directPayText}

[결제 및 납기 리드타임 조건]
• 결제 조건: 선금 30% (₩${generatedQuote.depositKRW?.toLocaleString()}원) 입금 확인 후 생산 개시 / 제품 출고 전 잔금 70% (₩${generatedQuote.balanceKRW?.toLocaleString()}원) 완납 조건
• 생산 납기: 선금 입금 확인 완료일 기준 약 ${generatedQuote.leadTimeWeeks}주 소요

최종 제안가 합계액: ₩${generatedQuote.totalPrice.toLocaleString()}원 (${generatedQuote.tradeTerm === 'fob_buyer_clearance' ? '한국 부가가치세 비대상/해당없음' : '부가세 별도'})
※ 위 견적은 시장상황에 따라 수시로 변동이 가능합니다.
현황 단계: 1차 수수료 마진율 검증 완료 및 제안서 제공 단계
※ 자세한 사항은 안내드린 위챗/카카오톡을 통해 전문 컨설팅과 정식 인보이스를 참고바랍니다.`;

    const textarea = document.createElement('textarea');
    textarea.value = textToCopy;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
      showNotification('메신저에 즉시 전송이 가능한 정형 요약 데이터가 복사되었습니다.');
    } catch (err) {
      showNotification('클립보드 저장 실패', 'error');
    }
    document.body.removeChild(textarea);
  };

  const handleDownloadQuotePdf = async () => {
    if (!generatedQuote || !quotePdfRef.current || isDownloadingPdf) return;

    setIsDownloadingPdf(true);

    const sourceElement = quotePdfRef.current;
    const clonedElement = sourceElement.cloneNode(true);

    clonedElement.style.position = 'fixed';
    clonedElement.style.top = '0';
    clonedElement.style.left = '-10000px';
    clonedElement.style.width = `${sourceElement.offsetWidth}px`;
    clonedElement.style.height = 'auto';
    clonedElement.style.maxHeight = 'none';
    clonedElement.style.overflow = 'visible';
    clonedElement.style.background = '#ffffff';

    document.body.appendChild(clonedElement);

    try {
      const canvas = await html2canvas(clonedElement, {
        backgroundColor: '#ffffff',
        scale: Math.min(2, window.devicePixelRatio || 1.5),
        useCORS: true,
        logging: false,
        width: clonedElement.scrollWidth,
        height: clonedElement.scrollHeight,
        windowWidth: clonedElement.scrollWidth,
        windowHeight: clonedElement.scrollHeight
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const printableWidth = pageWidth - margin * 2;
      const printableHeight = pageHeight - margin * 2;
      const pageCanvasHeight = Math.floor((canvas.width * printableHeight) / printableWidth);
      let renderedHeight = 0;
      let isFirstPage = true;

      while (renderedHeight < canvas.height) {
        const sliceHeight = Math.min(pageCanvasHeight, canvas.height - renderedHeight);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;

        const pageContext = pageCanvas.getContext('2d');
        pageContext.drawImage(
          canvas,
          0,
          renderedHeight,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        const pageImageData = pageCanvas.toDataURL('image/png');
        const pageImageHeight = (sliceHeight * printableWidth) / canvas.width;

        if (!isFirstPage) {
          pdf.addPage();
        }

        pdf.addImage(pageImageData, 'PNG', margin, margin, printableWidth, pageImageHeight);
        renderedHeight += sliceHeight;
        isFirstPage = false;
      }

      const safeFileName = `SPMS-${generatedQuote.quoteId}-${generatedQuote.vendorName}`
        .replace(/[\\/:*?"<>|]/g, '-')
        .replace(/\s+/g, '_');

      pdf.save(`${safeFileName}.pdf`);
      showNotification('1차 견적서 PDF 파일이 로컬에 다운로드되었습니다.');
    } catch (error) {
      console.warn('PDF download failed.', error);
      showNotification('PDF 다운로드 중 오류가 발생했습니다. 첨부 이미지 링크 또는 브라우저 권한을 확인해 주세요.', 'error');
    } finally {
      document.body.removeChild(clonedElement);
      setIsDownloadingPdf(false);
    }
  };

  const loadMockDatabase = () => {
    const mockVendors = [
      { id: 'V001', companyName: '(주)아웃도어컴퍼니', address: '경기도 성남시 분당구 판교역로 150', manager: '안현우 팀장', email: 'hw.ahn@outdoorco.kr', wechat: 'wx_hw_ahn', kakao: 'outdoor_ahn', phone: '010-4455-8899', registeredAt: '2026-06-03' },
      { id: 'V002', companyName: '에이블 라이프웨어', address: '서울시 강남구 압구정로 300', manager: '김은지 수석', email: 'eunji@ablelife.co.kr', wechat: 'eunji_cn', kakao: 'eunji_kakaotalk', phone: '010-9900-1122', registeredAt: '2026-06-05' },
      { id: 'V003', companyName: '센스디자인가구', address: '인천시 서구 원창동 가구단지 5길', manager: '박선영 과장', email: 'sy.park@sensedesign.com', wechat: 'park_sense', kakao: 'sy_park_design', phone: '010-2233-4455', registeredAt: '2026-06-08' }
    ];

    const mockRequests = [
      { id: 'REQ-2026-001', vendorId: 'V001', productName: '이지 폴딩 캠핑 오거나이저 테이블', specs: '캠핑용 알루미늄 상판 분할 및 3단 조절 수납 바스켓 통합형', quantity: 1500, imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400', refUrl: 'https://smartstore.naver.com', requestType: 'sourcing', status: 'pending', createdAt: '2026-06-03', localImages: null, tradeTerm: 'fob_buyer_clearance' },
      { id: 'REQ-2026-002', vendorId: 'V002', productName: '무균 세라믹 도자기 냄비 세트', specs: '무균 고온소성 내열 자재, 핑크/크림색 등 파스텔 색상 커스텀 패키징', quantity: 50, imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400', refUrl: 'https://smartstore.naver.com', requestType: 'planning', status: 'processing', createdAt: '2026-06-05', localImages: null, tradeTerm: 'fob_spms_clearance' },
      { id: 'REQ-2026-003', vendorId: 'V003', productName: '스마트 빌트인 무선충전 원목 협탁', specs: '상판 무선 듀얼 충전 모듈 매립, 서랍 전면 패브릭 우드 톤 OEM 의뢰', quantity: 500, imageUrl: '', refUrl: 'https://smartstore.naver.com', requestType: 'planning', status: 'quoted', createdAt: '2026-06-08', localImages: ['https://images.unsplash.com/photo-1532372320978-9b4d8a3a0245?w=400'], tradeTerm: 'fob_spms_clearance' }
    ];

    setVendors(mockVendors);
    setRequests(mockRequests);
    persistPortalData(mockVendors, mockRequests);
    showNotification('시뮬레이션 전용 프리미엄 바이어 3개 세트의 무역 원장이 주입되었습니다.');
  };

  const filteredDatabase = requests.filter(req => {
    const vendor = vendors.find(v => v.id === req.vendorId) || {};
    const matchesSearch = 
      req.productName.toLowerCase().includes(dbSearchQuery.toLowerCase()) ||
      (vendor.companyName && vendor.companyName.toLowerCase().includes(dbSearchQuery.toLowerCase())) ||
      (vendor.manager && vendor.manager.toLowerCase().includes(dbSearchQuery.toLowerCase())) ||
      req.id.toLowerCase().includes(dbSearchQuery.toLowerCase());
    
    const matchesStatus = dbStatusFilter === 'all' ? true : req.status === dbStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeVendor = vendors.find(v => v.id === selectedVendorId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* 글로벌 스타일 사출: 완벽한 '맑은 고딕(Malgun Gothic)'체 렌더링 강제화 */}
      <style>{`
        body, input, select, textarea, button, table, div, span, h1, h2, h3, h4, h5, h6 {
          font-family: 'Malgun Gothic', '맑은 고딕', 'Segoe UI', AppleSDGothicNeo, sans-serif !important;
        }
      `}</style>

      {/* =========================================
          GLOBAL HEADER
          ========================================= */}
      <header className="bg-slate-900 text-white py-4 px-6 sticky top-0 z-30 shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <SpmsLogo className="h-10 text-white" />
            <div className="hidden sm:block border-l border-slate-700 pl-4">
              <h1 className="text-md font-black tracking-wide text-indigo-400">GLOBAL B2B SOURCING PORTAL</h1>
            </div>
          </div>
          
          {/* 모드 전환 탭 */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button 
              onClick={() => { setActiveTab('client'); setSelectedRequest(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'client' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'}`}
            >
              <Building className="w-3.5 h-3.5" />
              바이어 서비스 (의뢰서 등록)
            </button>
            <button 
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'}`}
            >
              <Settings className="w-3.5 h-3.5" />
              관리자 모드 (원가책정 및 전송)
              {!isAdminAuthenticated && <Lock className="w-3 h-3 text-amber-400" />}
              {isAdminAuthenticated && <Unlock className="w-3 h-3 text-emerald-400 animate-pulse" />}
              {requests.filter(r => r.status === 'pending').length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1">
                  {requests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 알림 토스트 팝업 */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border text-white ${toast.type === 'error' ? 'bg-red-500 border-red-600' : 'bg-emerald-600 border-emerald-700'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            <span className="font-bold text-xs">{toast.message}</span>
          </div>
        </div>
      )}

      {/* =========================================
          MAIN CONTENTS
          ========================================= */}
      <main className="max-w-5xl mx-auto p-4 md:p-8">
        
        {/* =========================================
            CLIENT VIEW
            ========================================= */}
        {activeTab === 'client' && (
          <div className="space-y-8 max-w-3xl mx-auto">
            
            {/* 상단 고객 안내 배너 */}
            <section className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-6 md:p-8 rounded-3xl shadow-xl space-y-6 border border-indigo-900/30">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <SpmsLogo className="h-11 text-white" />
                </div>
                <span className="bg-emerald-500 text-slate-950 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider self-start md:self-auto">
                  바이어 전용 원스톱 기획·소싱 통합 창구
                </span>
              </div>
              <div className="space-y-3">
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-semibold">
                  바이어 정보와 구체적인 스펙을 입력하시면, 실시간 환율과 제조 공장 원가를 기반으로 최적의 대행 수수료가 반영된 1차 견적서를 산출하여 기재하신 연락처(카카오톡 / 위챗 / 이메일)로 가장 빠르게 발송해 드립니다.
                </p>
              </div>
            </section>

            {/* STEP 1. 바이어 필수 정보 입력 */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-md md:text-lg font-black text-slate-800">STEP 1. 바이어 기본 정보 입력</h3>
                  <p className="text-xs text-slate-500 font-semibold">정밀한 글로벌 공장 수색 및 견적 안내를 위해 필수 기입 항목을 입력해 주시기 바랍니다.</p>
                </div>
              </div>

              <form onSubmit={handleRegisterVendor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">회사명 (상호) <span className="text-red-500 font-black">* 필수</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="예: 주식회사 에스피엠에스"
                    value={vendorForm.companyName}
                    onChange={(e) => setVendorForm({...vendorForm, companyName: e.target.value})}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">담당자 성함 <span className="text-red-500 font-black">* 필수</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="예: 홍길동 부장"
                    value={vendorForm.manager}
                    onChange={(e) => setVendorForm({...vendorForm, manager: e.target.value})}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    의뢰 요청일 <span className="text-red-500 font-black">* 필수</span>
                  </label>
                  <input 
                    type="date" 
                    required
                    value={vendorForm.registeredAt}
                    onChange={(e) => setVendorForm({...vendorForm, registeredAt: e.target.value})}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">회사 주소 <span className="text-red-500 font-black">* 필수</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="예: 서울시 마포구 신촌로 10"
                    value={vendorForm.address}
                    onChange={(e) => setVendorForm({...vendorForm, address: e.target.value})}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">이메일 주소 <span className="text-red-500 font-black">* 필수</span></label>
                  <input 
                    type="email" 
                    required
                    placeholder="partner@email.com"
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({...vendorForm, email: e.target.value})}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">연락처 (전화번호) <span className="text-red-500 font-black">* 필수</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="010-1234-5678"
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({...vendorForm, phone: e.target.value})}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2 p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-[11px] font-bold text-indigo-950 flex items-center gap-1.5 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                  신속한 1차 모바일 견적 및 알림 제공을 위해 카카오톡 ID와 위챗 ID 중 최소 하나는 필수로 적어주셔야 원스톱 조율이 가능합니다.
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">카카오톡 ID <span className="text-indigo-600 font-black">(교차 필수)*</span></label>
                  <input 
                    type="text" 
                    placeholder="카카오톡 아이디"
                    value={vendorForm.kakao}
                    onChange={(e) => setVendorForm({...vendorForm, kakao: e.target.value})}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">위챗 ID (WeChat) <span className="text-indigo-600 font-black">(교차 필수)*</span></label>
                  <input 
                    type="text" 
                    placeholder="위챗 아이디"
                    value={vendorForm.wechat}
                    onChange={(e) => setVendorForm({...vendorForm, wechat: e.target.value})}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end pt-2">
                  <button 
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-6 py-3 rounded-lg transition-all shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    바이어 기본 정보 등록 완료하기
                  </button>
                </div>
              </form>
            </div>

            {/* STEP 2. 신규 상품 소싱 및 기획 의뢰 */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-md md:text-lg font-black text-slate-800">STEP 2. 상세 제품 소싱 및 제작 기획 의뢰</h3>
                    <p className="text-xs text-slate-500 font-semibold">희망하시는 제품의 정밀 스펙과 디자인 및 제조 공장 소싱을 위한 참고 이미지를 등록해 주세요.</p>
                  </div>
                </div>
              </div>

              {/* 바이어 정보 자동 바인딩 상태 알림 */}
              <div className="mb-6">
                <label className="block text-xs font-black text-indigo-950 mb-1.5">소싱 의뢰 대상 바이어 연동 상태</label>
                {activeVendor ? (
                  <div className="flex items-center justify-between bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-2 text-xs text-indigo-950 font-bold">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>{activeVendor.companyName}</span>
                      <span className="text-xs font-normal text-indigo-600">({activeVendor.manager}님 / 의뢰일: {activeVendor.registeredAt})</span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded">
                      의뢰 대상 바이어 자동 식별 완료
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-amber-800 bg-amber-50 border border-amber-100 p-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-semibold leading-relaxed">
                      아직 바이어 기본 정보가 없습니다. 상단의 'STEP 1. 바이어 기본 정보 입력'을 먼저 기재 및 등록 완료해주시면 실시간 자동 동기화 처리됩니다.
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleRequestProduct} className="space-y-5">
                
                {/* 진행 형태 선택 (소싱 vs 기획) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">의뢰 구분 선택 <span className="text-red-500 font-black">* 필수</span></label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${productForm.requestType === 'sourcing' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <input 
                          type="radio" 
                          name="requestType" 
                          value="sourcing"
                          checked={productForm.requestType === 'sourcing'}
                          onChange={() => setProductForm({...productForm, requestType: 'sourcing'})}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-extrabold text-sm">기성품 단순 소싱 (Sourcing)</span>
                      </div>
                      <span className="text-[11px] text-slate-500 leading-relaxed pl-5 mt-1 font-semibold">
                        이미 시장에 유통되고 있는 기성 제품군을 발굴하여 최저 공급가격을 매칭합니다.
                      </span>
                    </label>

                    <label className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${productForm.requestType === 'planning' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <input 
                          type="radio" 
                          name="requestType" 
                          value="planning"
                          checked={productForm.requestType === 'planning'}
                          onChange={() => setProductForm({...productForm, requestType: 'planning'})}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-extrabold text-sm">신제품 개발 및 커스텀 기획 (Planning)</span>
                      </div>
                      <span className="text-[11px] text-slate-500 leading-relaxed pl-5 mt-1 font-semibold">
                        소재 변경, 가공 방식 지정, 금형 개조, 고유 브랜드 라벨 부착 및 독점 OEM/ODM 제작 패키징을 기획합니다.
                      </span>
                    </label>
                  </div>
                </div>

                {/* 실무 추가: 수출입 인도 조건 선택 (FOB 1번 vs 2번 분기) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">수출입 인도 조건 선택 <span className="text-red-500 font-black">* 필수</span></label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${productForm.tradeTerm === 'fob_buyer_clearance' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <input 
                          type="radio" 
                          name="tradeTerm" 
                          value="fob_buyer_clearance"
                          checked={productForm.tradeTerm === 'fob_buyer_clearance'}
                          onChange={() => setProductForm({...productForm, tradeTerm: 'fob_buyer_clearance'})}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-extrabold text-xs md:text-sm">1. 상해 SPMS FOB조건 ➔ 수입통관 바이어 직접진행</span>
                      </div>
                      <span className="text-[11px] text-slate-500 leading-relaxed pl-5 mt-1 font-semibold">
                        중국 상해 포트 선적 인도 조건입니다. 관세, 한국 부가세 및 한국 내 통관 수입 부대비용은 바이어가 세관에 직접 납부/부담하며, 견적서에 가산되지 않습니다.
                      </span>
                    </label>

                    <label className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${productForm.tradeTerm === 'fob_spms_clearance' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <input 
                          type="radio" 
                          name="tradeTerm" 
                          value="fob_spms_clearance"
                          checked={productForm.tradeTerm === 'fob_spms_clearance'}
                          onChange={() => setProductForm({...productForm, tradeTerm: 'fob_spms_clearance'})}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-extrabold text-xs md:text-sm">2. 상해 SPMS FOB조건 ➔ 한국 SPMS 수입서비스 대행</span>
                      </div>
                      <span className="text-[11px] text-slate-500 leading-relaxed pl-5 mt-1 font-semibold">
                        한국 내 정식 수입 대행, 관부가세 납부 위탁, 서류 절차 및 항구 출고 통관 사후 처리를 SPMS에서 완스톱 패키지 대행으로 가산 청구해 드립니다.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">의뢰할 상품명 <span className="text-red-500 font-black">* 필수</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="예: 다용도 밀폐 세라믹 보관용기 세트"
                      value={productForm.productName}
                      onChange={(e) => setProductForm({...productForm, productName: e.target.value})}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">희망 필요 수량 (MOQ) <span className="text-red-500 font-black">* 필수</span></label>
                    <input 
                      type="number" 
                      required
                      placeholder="예: 1000"
                      value={productForm.quantity}
                      onChange={(e) => setProductForm({...productForm, quantity: e.target.value})}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">상세 스펙 및 요구사양 <span className="text-red-500 font-black">* 필수 (최소 5자 이상 기재)</span></label>
                  <textarea 
                    rows="3"
                    required
                    placeholder="두께 사양, 내열 온도 사양, 무해물질 안전성 시험성적서 발급 요건, 개별 포장 박스 로고 인쇄 희망 형태 등을 상세하게 적어주실수록 정확한 공장이 조기 매칭됩니다."
                    value={productForm.specs}
                    onChange={(e) => setProductForm({...productForm, specs: e.target.value})}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* 이미지 업로드/링크 선택 및 파일 멀티 업로드 섹션 */}
                <div className="border border-slate-200 p-4 rounded-xl bg-slate-50 space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <label className="text-xs font-extrabold text-slate-700">참고 제품 이미지 제공 방식 <span className="text-red-500 font-black">* 필수</span></label>
                    <div className="flex gap-2 bg-white p-1 rounded-lg border text-xs">
                      <button 
                        type="button"
                        onClick={() => { setHasImageLink(true); setUploadedImages([]); }}
                        className={`px-3 py-1.5 rounded-md font-bold transition-all ${hasImageLink ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        네이버 / 쿠팡 판매 URL 링크 입력
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setHasImageLink(false); setProductForm({...productForm, imageUrl: ''}); }}
                        className={`px-3 py-1.5 rounded-md font-bold transition-all ${!hasImageLink ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        참고용 제품 사진 직접 첨부 (최대 3장)
                      </button>
                    </div>
                  </div>

                  {hasImageLink ? (
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">네이버 / 쿠팡 제품 이미지 링크 <span className="text-red-500 font-black">* 필수</span></label>
                      <input 
                        type="url" 
                        required={hasImageLink}
                        placeholder="https://smartstore.naver.com/... 혹은 https://www.coupang.com/..."
                        value={productForm.imageUrl}
                        onChange={(e) => setProductForm({...productForm, imageUrl: e.target.value})}
                        className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">제품 참고 실물 사진 파일 등록 <span className="text-red-500 font-black">* 필수 (3장 이내)</span></label>
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-slate-50">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 text-slate-400 mb-2" />
                            <p className="text-xs text-slate-500 font-bold"><span className="text-indigo-600">이곳을 터치하거나 클릭하여</span> 참고 이미지를 직접 등록해 주세요.</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">JPG, JPEG, PNG 형식 지원 (현재 {uploadedImages.length}/3장 등록됨)</p>
                          </div>
                          <input 
                            type="file" 
                            multiple 
                            accept="image/*"
                            disabled={uploadedImages.length >= 3}
                            onChange={handleImageChange}
                            className="hidden" 
                          />
                        </label>
                      </div>

                      {/* 업로드 이미지 미리보기 */}
                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 pt-2">
                          {uploadedImages.map((imgSrc, idx) => (
                            <div key={idx} className="relative aspect-square border rounded-lg overflow-hidden bg-white shadow-sm">
                              <img src={imgSrc} alt={`제품첨부사진-${idx}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeUploadedImage(idx)}
                                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full text-xs shadow-md transition-all"
                                title="사진 제거"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">해외 참조 URL (선택사항 - 타오바오, 1688, 아마존 등)</label>
                    <input 
                      type="url" 
                      placeholder="https://detail.1688.com/... 또는 기타 레퍼런스 판매 주소"
                      value={productForm.refUrl}
                      onChange={(e) => setProductForm({...productForm, refUrl: e.target.value})}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    type="submit"
                    disabled={!selectedVendorId}
                    className={`w-full font-black text-xs md:text-sm px-8 py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${selectedVendorId ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                  >
                    <Send className="w-4 h-4 text-emerald-400" />
                    B2B 소싱 및 기획 의뢰 접수하기
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

        {/* =========================================
            ADMIN VIEW
            ========================================= */}
        {activeTab === 'admin' && (
          <div className="space-y-8">
            
            {/* 1. 관리자 락 스크린 */}
            {!isAdminAuthenticated ? (
              <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 space-y-6 text-center animate-fade-in">
                <div className="bg-amber-50 text-amber-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto border border-amber-200">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">관리자 시스템 로그인</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-semibold">
                    본 화면은 소싱 원가율 책정, 마진율 제어 및 통합 DB 모니터링을 위한 관리자 전용 대시보드입니다.
                  </p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <input 
                      type="password" 
                      required
                      placeholder="보안 패스워드 입력"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full text-center text-sm font-bold border-2 border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {passwordError && <p className="text-xs text-red-500 font-extrabold mt-2">{passwordError}</p>}
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-black py-3.5 rounded-xl transition-all shadow flex items-center justify-center gap-1.5"
                  >
                    <Unlock className="w-4 h-4 text-emerald-400" />
                    대시보드 접속 승인
                  </button>
                </form>
              </div>
            ) : (
              /* 2. 관리자 비밀번호 통과 화면 */
              <div className="space-y-8 animate-fade-in">
                
                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Unlock className="w-5 h-5 text-emerald-400 animate-pulse" />
                      <h2 className="text-lg font-black">B2B 공급망 분석 및 실시간 마진율 통제 데스크</h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 font-semibold">
                      고객 입력 보안을 위해 등록 현황, 바이어 원장 및 이력 관리 모듈이 이 관리자 패널로 통합 이관되었습니다.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 self-stretch md:self-auto text-xs">
                    <button 
                      onClick={loadMockDatabase}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow"
                    >
                      <Database className="w-3.5 h-3.5" />
                      시뮬레이션 바이어 3개사 즉시 자동 주입
                    </button>
                    <button 
                      onClick={handleAdminLogout}
                      className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      관리 세션 로그아웃
                    </button>
                  </div>
                </div>

                {/* 관리 메뉴 서브탭 */}
                <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
                  <button 
                    onClick={() => setAdminSubTab('workspace')}
                    className={`pb-3 text-sm border-b-2 transition-all ${adminSubTab === 'workspace' ? 'border-indigo-600 text-indigo-600 font-extrabold' : 'border-transparent text-slate-500'}`}
                  >
                    1. 1차 원가 조율 및 견적서 승인 데스크
                  </button>
                  <button 
                    onClick={() => setAdminSubTab('database')}
                    className={`pb-3 text-sm border-b-2 transition-all flex items-center gap-1.5 ${adminSubTab === 'database' ? 'border-indigo-600 text-indigo-600 font-extrabold' : 'border-transparent text-slate-500'}`}
                  >
                    2. 바이어 통합 원장 및 진행 이력 DB ({vendors.length}개사)
                  </button>
                </div>

                {/* SUB TAB 1. 소싱원가 마진 수동 제어 */}
                {adminSubTab === 'workspace' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* 왼쪽 : 실시간 수령함 인박스 */}
                    <div className="lg:col-span-4 space-y-4">
                      <h3 className="text-xs font-black text-slate-800 flex items-center gap-1 uppercase tracking-wider">
                        <span>실시간 인커밍 의뢰 인박스</span>
                        <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black ml-1">{requests.length}</span>
                      </h3>

                      <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                        {requests.length === 0 ? (
                          <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs font-semibold">
                            현재 수령된 바이어 의뢰가 비어 있습니다. 상단의 '시뮬레이션 바이어 3개사 즉시 자동 주입'을 클릭해 주세요.
                          </div>
                        ) : (
                          requests.map(req => {
                            const vendor = vendors.find(v => v.id === req.vendorId);
                            const isSelected = selectedRequest?.id === req.id;
                            
                            return (
                              <div 
                                key={req.id} 
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setAdminCostCNY(req.requestType === 'sourcing' ? 45 : 120);
                                }}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${isSelected ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-100' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="pr-6">
                                    <span className="text-[10px] text-slate-400 font-mono font-bold">{req.id}</span>
                                    <h4 className="text-xs font-black text-slate-800 line-clamp-1">{req.productName}</h4>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getStatusBadgeStyle(req.status)}`}>
                                      {getStatusLabel(req.status, req.requestType)}
                                    </span>
                                    {/* 의뢰 카드 개별 삭제 버튼 */}
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteRequest(req.id, e)}
                                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-all"
                                      title="의뢰 영구 삭제"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-1 text-[11px] text-slate-600 font-semibold leading-relaxed">
                                  <div>의뢰기관: <strong className="text-slate-800">{vendor?.companyName}</strong></div>
                                  <div className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md inline-block mt-1">
                                    인도조건: {req.tradeTerm === 'fob_buyer_clearance' ? 'FOB 상해 (바이어 직접통관)' : 'FOB 상해 ➔ 수입대행 서비스'}
                                  </div>
                                  <div className="flex justify-between mt-1">
                                    <span>수량: <strong>{req.quantity.toLocaleString()} 개</strong></span>
                                    <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                                      {req.requestType === 'sourcing' ? '일반소싱' : '기획OEM'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                    </div>

                    {/* 오른쪽 : 원가 및 마진 조율 본관 */}
                    <div className="lg:col-span-8">
                      {selectedRequest ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-6">
                          
                          <div className="border-b border-slate-100 pb-4 flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedRequest.requestType === 'sourcing' ? 'bg-amber-100 text-amber-900' : 'bg-indigo-100 text-indigo-900'}`}>
                                  {selectedRequest.requestType === 'sourcing' ? '기성 수입 소싱' : '디자인 기획 커스텀 OEM'}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono font-bold">ID: {selectedRequest.id}</span>
                              </div>
                              <h3 className="text-lg font-black text-slate-900">{selectedRequest.productName}</h3>
                              <p className="text-xs text-slate-500 mt-1.5 font-semibold">
                                의뢰기관명: <strong className="text-slate-700">{vendors.find(v => v.id === selectedRequest.vendorId)?.companyName}</strong>
                              </p>
                              
                              {/* 인도 조건 표시 배지 */}
                              <div className="mt-2 inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-950 font-bold px-2.5 py-1 rounded-lg text-xs">
                                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                                <span>선택된 인도조건: </span>
                                <strong className="text-indigo-700">
                                  {selectedRequest.tradeTerm === 'fob_buyer_clearance' 
                                    ? '1. 상해 SPMS FOB조건 ➔ 수입통관 바이어 직접진행' 
                                    : '2. 상해 SPMS FOB조건 ➔ 한국 SPMS 수입서비스 대행'}
                                </strong>
                              </div>
                            </div>
                            <button 
                              onClick={() => setSelectedRequest(null)}
                              className="text-xs text-slate-400 hover:text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg font-bold"
                            >
                              패널 닫기
                            </button>
                          </div>

                          {/* 이미지 조회 그리드 */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                            <span className="text-xs font-black text-slate-700 block">바이어 제공 참고 이미지</span>
                            {selectedRequest.localImages && selectedRequest.localImages.length > 0 ? (
                              <div className="grid grid-cols-3 gap-3">
                                {selectedRequest.localImages.map((src, idx) => (
                                  <div key={idx} className="relative aspect-square border rounded-lg overflow-hidden bg-white shadow-sm">
                                    <img src={src} alt="바이어제공_실물사진" className="w-full h-full object-cover" />
                                    <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                                      실물 이미지 {idx + 1}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : selectedRequest.imageUrl ? (
                              <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border">
                                <div className="w-14 h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0 border">
                                  <img src={selectedRequest.imageUrl} alt="레퍼런스 이미지" className="w-full h-full object-cover" />
                                </div>
                                <div className="overflow-hidden space-y-1 font-semibold">
                                  <span className="text-[10px] text-slate-400 block font-bold">참조용 네이버/쿠팡 판매 URL</span>
                                  <a href={selectedRequest.imageUrl} target="_blank" rel="noreferrer" className="text-indigo-600 text-xs hover:underline truncate block max-w-md">
                                    {selectedRequest.imageUrl}
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 italic font-semibold">바이어가 등록한 이미지가 부재합니다.</div>
                            )}
                          </div>

                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-2 text-slate-700 font-semibold leading-relaxed">
                            <div><strong>정밀 사양 명세:</strong> {selectedRequest.specs || '없음'}</div>
                            <div><strong>희망 필요 수량:</strong> {selectedRequest.quantity.toLocaleString()} 개</div>
                            {selectedRequest.refUrl && (
                              <div>
                                <strong>참조 링크 주소:</strong>{' '}
                                <a href={selectedRequest.refUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline font-bold">
                                  {selectedRequest.refUrl}
                                </a>
                              </div>
                            )}
                          </div>

                          {/* 1. 글로벌 매입 원가 세팅 (CNY -> KRW 자동 환율 적용) */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">1. 중국 제조공장 원단위 책정 및 네이버 고시 환율 반영</h4>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">중국 현지 제조원가 (¥ CNY)</label>
                                <div className="relative">
                                  <input 
                                    type="number" 
                                    value={adminCostCNY} 
                                    onChange={(e) => setAdminCostCNY(Number(e.target.value))}
                                    className="w-full text-sm font-extrabold border border-indigo-200 rounded-lg p-2.5 pr-12 text-indigo-950 bg-indigo-50/10 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                  />
                                  <div className="absolute right-3 top-3 text-xs font-extrabold text-indigo-900">
                                    CNY (¥)
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">중국 네이버 적용 기준 환율 (₩)</label>
                                <div className="relative">
                                  <input 
                                    type="number" 
                                    step="0.1"
                                    value={exchangeRateCNY} 
                                    onChange={(e) => setExchangeRateCNY(Number(e.target.value))}
                                    className="w-full text-sm font-extrabold border border-indigo-200 rounded-lg p-2.5 pr-12 text-indigo-950 bg-indigo-50/10 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                  />
                                  <div className="absolute right-3 top-3 text-xs font-extrabold text-indigo-900">
                                    KRW (₩)
                                  </div>
                                </div>
                              </div>

                              <div className="md:col-span-2 p-3 bg-slate-100 rounded-xl border text-[11px] font-bold text-slate-700 flex justify-between items-center">
                                <span>[환율 자동 연산 공식]</span>
                                <span className="text-slate-900">
                                  공장원가 ¥{adminCostCNY.toLocaleString()} × 적용환율 {exchangeRateCNY}원 = <strong className="text-indigo-600 text-xs">₩{pricing.costInKRW.toLocaleString()}원</strong> (개당 원화 원장가)
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 2. 마진 조율 슬라이더 */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">2. 대행 수수료 및 마진 조율 슬라이더</h4>
                              <span className="bg-indigo-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full">
                                수수료율: {adminMargin}%
                              </span>
                            </div>

                            <div className="space-y-1">
                              <input 
                                type="range" 
                                min="0" 
                                max="30" 
                                step="1"
                                value={adminMargin} 
                                onChange={(e) => setAdminMargin(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                              />
                              <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                                <span>0% (수수료 면제)</span>
                                <span>15%</span>
                                <span>30% (최대)</span>
                              </div>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-100 grid grid-cols-2 text-xs gap-y-2 font-semibold">
                              <div className="text-slate-500">개당 마진 차액</div>
                              <div className="text-right font-extrabold text-slate-800">
                                {Math.round(pricing.appliedCostKRW * (adminMargin / 100)).toLocaleString()}원
                              </div>
                              <div className="text-slate-500">바이어 공급 단가 (개당 / 원화)</div>
                              <div className="text-right font-black text-indigo-600">
                                {pricing.finalUnitPrice.toLocaleString()}원
                              </div>
                            </div>
                          </div>

                          {/* 3. 관세율 및 한국 수입비용 / 중국 FOB 수출비용율 통제 섹션 (FOB 조건 1번에 따른 자동 비활성화 로직 적용) */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">3 & 4 & 5. 통관 제비용 및 한국 수입 대행비율 설정</h4>
                            
                            {selectedRequest.tradeTerm === 'fob_buyer_clearance' && (
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-bold text-[11px] flex items-start gap-1.5 leading-relaxed">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <span>
                                  <strong>[FOB 바이어 직접 진행 감안 안내]</strong> 이 의뢰서는 바이어가 직접 현지 수입통관 및 물류를 진행하는 FOB 조건입니다.
                                  관세율 설정 및 한국 내 수입 부대비용율이 시스템 연산식 상에서 자동으로 제외(`₩0원`)되어 청구서에 반영됩니다.
                                </span>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* 관세율 슬라이더 */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-extrabold text-slate-700">상품별 관세율 (0~20%)</span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${selectedRequest.tradeTerm === 'fob_buyer_clearance' ? 'bg-slate-200 text-slate-400 line-through' : 'bg-amber-50 text-amber-700'}`}>
                                    {selectedRequest.tradeTerm === 'fob_buyer_clearance' ? 'FOB 제외' : `${tariffRate}%`}
                                  </span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="20" 
                                  step="1"
                                  disabled={selectedRequest.tradeTerm === 'fob_buyer_clearance'}
                                  value={selectedRequest.tradeTerm === 'fob_buyer_clearance' ? 0 : tariffRate} 
                                  onChange={(e) => setTariffRate(Number(e.target.value))}
                                  className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600 ${selectedRequest.tradeTerm === 'fob_buyer_clearance' && 'opacity-40 cursor-not-allowed'}`}
                                />
                                <span className="text-[10px] text-slate-400 block font-semibold">관세액: ₩{pricing.tariffTotalKRW.toLocaleString()}원</span>
                              </div>

                              {/* 중국 FOB 수출비용율 */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-extrabold text-slate-700">중국 FOB 수출비용율 (0~15%)</span>
                                  <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">{chinaFobExportRate}%</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="15" 
                                  step="1"
                                  value={chinaFobExportRate} 
                                  onChange={(e) => setChinaFobExportRate(Number(e.target.value))}
                                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                                />
                                <span className="text-[10px] text-slate-400 block font-semibold">수출 가산액: ₩{(pricing.chinaExportCost * selectedRequest.quantity).toLocaleString()}원</span>
                              </div>

                              {/* 한국 내 수입 대행비용율 */}
                              <div className="space-y-2 md:col-span-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-extrabold text-slate-700">한국 내 수입 대행비용율 (0~15%)</span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${selectedRequest.tradeTerm === 'fob_buyer_clearance' ? 'bg-slate-200 text-slate-400 line-through' : 'bg-rose-50 text-rose-700'}`}>
                                    {selectedRequest.tradeTerm === 'fob_buyer_clearance' ? 'FOB 제외' : `${koreaImportRate}%`}
                                  </span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="15" 
                                  step="1"
                                  disabled={selectedRequest.tradeTerm === 'fob_buyer_clearance'}
                                  value={selectedRequest.tradeTerm === 'fob_buyer_clearance' ? 0 : koreaImportRate} 
                                  onChange={(e) => setKoreaImportRate(Number(e.target.value))}
                                  className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600 ${selectedRequest.tradeTerm === 'fob_buyer_clearance' && 'opacity-40 cursor-not-allowed'}`}
                                />
                                <span className="text-[10px] text-slate-400 block font-semibold">수입 부대비용: ₩{(pricing.koreaImportCost * selectedRequest.quantity).toLocaleString()}원</span>
                              </div>
                            </div>

                            {/* 소량주문 바이어 대납 토글 (조건 1번인 경우 일관성을 위해 자동 숨김 및 비활성화) */}
                            {selectedRequest.tradeTerm !== 'fob_buyer_clearance' && (
                              <div className="pt-3 border-t border-slate-200">
                                <label className="flex items-center gap-2.5 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={isSmallVolumeDirectPay}
                                    onChange={(e) => setIsSmallVolumeDirectPay(e.target.checked)}
                                    className="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                  />
                                  <div className="text-xs font-semibold">
                                    <span className="font-extrabold text-slate-900 block">[소량 화물 조건] 수출입 통관 비용 바이어(업체) 직접 실비 부담 조건</span>
                                    <span className="text-[10px] text-slate-500 mt-0.5 block">체크 시, 수수료 견적서 합계에서 수출입 대행비가 제외되며 '직납 조건'으로 명기됩니다.</span>
                                  </div>
                                </label>
                              </div>
                            )}

                            <div className="bg-white p-3 rounded-lg border border-slate-100 grid grid-cols-2 text-xs gap-y-2 font-semibold">
                              <div className="text-slate-500">원가 반영 수출입 부대비 합산액</div>
                              <div className="text-right font-extrabold text-slate-800">
                                {selectedRequest.tradeTerm === 'fob_buyer_clearance' 
                                  ? '₩0 원 (FOB 상해 항구 조건)' 
                                  : isSmallVolumeDirectPay 
                                    ? '₩0 원 (소량 직접 처리)' 
                                    : `₩${(pricing.chinaExportCost + pricing.koreaImportCost).toLocaleString()} 원 (개당)`}
                              </div>
                              <div className="text-slate-500">관세 대행 청구액 ({selectedRequest.quantity}개 기준)</div>
                              <div className="text-right font-black text-amber-700">
                                {selectedRequest.tradeTerm === 'fob_buyer_clearance' 
                                  ? '₩0 원 (바이어 현지 자가 납부)' 
                                  : isSmallVolumeDirectPay 
                                    ? '₩0 원 (세관 직접납)' 
                                    : `₩${pricing.tariffTotalKRW.toLocaleString()} 원`}
                              </div>
                            </div>
                          </div>

                          {/* 4. 생산 납기 및 결제 조건 실무 설정 섹션 */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">4. 생산 딜리버리 및 납기 리드타임 설정 (1주 ~ 12주)</h4>
                              <span className="bg-indigo-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full">
                                납기: 약 {leadTimeWeeks}주 소요
                              </span>
                            </div>

                            <div className="space-y-1">
                              <input 
                                type="range" 
                                min="1" 
                                max="12" 
                                step="1"
                                value={leadTimeWeeks} 
                                onChange={(e) => setLeadTimeWeeks(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                              />
                              <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                                <span>1주 (최소)</span>
                                <span>4주 (표준)</span>
                                <span>8주</span>
                                <span>12주 (최대)</span>
                              </div>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-1.5 text-xs text-slate-700 font-semibold leading-relaxed">
                              <div>• 결제 조건: <span className="text-indigo-600 font-bold">선금 30% 입금 확인 후 생산 착수, 인도 전 잔금 70% 입금 조건</span></div>
                              <div className="grid grid-cols-2 gap-2 mt-1 bg-slate-50 p-2 rounded border">
                                <div>• 계약금 (선금 30%): <strong className="text-slate-900">₩ {pricing.depositKRW.toLocaleString()} 원</strong></div>
                                <div>• 출고 전 정산 (잔금 70%): <strong className="text-slate-900">₩ {pricing.balanceKRW.toLocaleString()} 원</strong></div>
                              </div>
                            </div>
                          </div>

                          {/* 5. 진행 단계 업데이트 제어 */}
                          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
                            <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">5. 수동 의뢰 진행현황 단계 강제 변환</h4>
                            <div className="grid grid-cols-4 gap-2 text-xs">
                              {['pending', 'processing', 'quoted', 'success'].map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleUpdateStatus(selectedRequest.id, st)}
                                  className={`py-2.5 font-bold rounded-lg border transition-all ${selectedRequest.status === st ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-700'}`}
                                >
                                  {getStatusLabel(st, selectedRequest.requestType)}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 6. 공급 가산 결과 합산 */}
                          <div className="bg-indigo-950 text-white p-4 rounded-xl flex justify-between items-center">
                            <div>
                              <span className="text-[10px] text-indigo-300 font-bold block uppercase tracking-wider">최종 공급 합계 제안가 (VAT 별도)</span>
                              <div className="text-lg md:text-xl font-black text-emerald-400">
                                {pricing.finalTotalKRW.toLocaleString()} 원
                              </div>
                            </div>
                            <button 
                              type="button"
                              onClick={handleGenerateQuote}
                              className="bg-emerald-400 hover:bg-emerald-500 text-slate-900 font-black text-xs px-5 py-3 rounded-lg transition-all shadow flex items-center gap-1"
                            >
                              <FileText className="w-4 h-4" />
                              1차 디지털 제안서 발송
                            </button>
                          </div>

                        </div>
                      ) : (
                        <div className="bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px]">
                          <Sliders className="w-12 h-12 text-slate-300 mb-3" />
                          <h3 className="text-sm font-bold">의뢰 처리 작업 대기중</h3>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm font-semibold">
                            왼쪽의 인커밍 수령함 리스트에서 바이어가 올린 소싱 카드를 선택하시면 조율 작업 도크가 이곳에 마운트됩니다.
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* SUB TAB 2. 바이어 통합 원장 종합 DB */}
                {adminSubTab === 'database' && (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-xs">
                    
                    {/* 상부 검색 및 정렬 제어바 */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-3 justify-between items-center">
                      <div className="relative w-full md:w-96">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                          <Search className="w-4 h-4" />
                        </span>
                        <input 
                          type="text" 
                          value={dbSearchQuery}
                          onChange={(e) => setDbSearchQuery(e.target.value)}
                          placeholder="회사명, 담당자명, 상품명, 요청ID 검색..."
                          className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-semibold"
                        />
                      </div>

                      <div className="flex gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-1 bg-white border px-3 py-1.5 rounded-lg font-bold text-slate-700">
                          <Filter className="w-3.5 h-3.5 text-slate-400" />
                          <span>정렬 단계:</span>
                          <select 
                            value={dbStatusFilter} 
                            onChange={(e) => setDbStatusFilter(e.target.value)}
                            className="border-none focus:outline-none bg-transparent font-bold cursor-pointer"
                          >
                            <option value="all">전체 단계 조회</option>
                            <option value="pending">접수 완료</option>
                            <option value="processing">소싱/기획중</option>
                            <option value="quoted">제안 제공완료</option>
                            <option value="success">발주 계약성공</option>
                          </select>
                        </div>

                        <div className="bg-white border text-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <span>총 의뢰 건수:</span>
                          <strong className="text-indigo-600">{filteredDatabase.length}건</strong>
                        </div>
                      </div>
                    </div>

                    {/* 통합 DB 테이블 */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-slate-600 divide-y divide-slate-200 text-left">
                        <thead className="bg-slate-100 text-[11px] text-slate-700 font-black">
                          <tr>
                            <th className="p-3">의뢰 요청일</th>
                            <th className="p-3">식별 ID</th>
                            <th className="p-3">의뢰 기업명 및 주소</th>
                            <th className="p-3">담당자 연락인프라</th>
                            <th className="p-3">요청 품목 및 의뢰 구분</th>
                            <th className="p-3 text-right">필요 수량</th>
                            <th className="p-3 text-center">진행 상태</th>
                            <th className="p-3 text-center">컨트롤</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-semibold">
                          {filteredDatabase.length === 0 ? (
                            <tr>
                              <td colSpan="8" className="p-12 text-center text-slate-400 font-bold">
                                통합 검색 또는 필터링 조건에 부합하는 바이어 및 소싱 이력이 존재하지 않습니다.
                              </td>
                            </tr>
                          ) : (
                            filteredDatabase.map(req => {
                              const vendor = vendors.find(v => v.id === req.vendorId) || {};
                              return (
                                <tr key={req.id} className="hover:bg-indigo-50/20 transition-all">
                                  <td className="p-3 font-mono whitespace-nowrap">{vendor.registeredAt || req.createdAt}</td>
                                  <td className="p-3 font-mono text-indigo-600 font-bold">{req.id}</td>
                                  <td className="p-3 font-extrabold text-slate-900">
                                    {vendor.companyName || '미지정'}
                                    <span className="text-[10px] text-slate-400 font-normal block mt-0.5">{vendor.address}</span>
                                  </td>
                                  <td className="p-3 leading-relaxed">
                                    <div className="font-extrabold text-slate-800">{vendor.manager}</div>
                                    <div className="text-[10px] text-slate-500">{vendor.phone}</div>
                                    <div className="text-[9px] text-indigo-700 font-mono">카톡: {vendor.kakao || '-'} | 위챗: {vendor.wechat || '-'}</div>
                                  </td>
                                  <td className="p-3">
                                    <div className="font-extrabold text-slate-900">{req.productName}</div>
                                    <div className="flex flex-col gap-1 mt-1">
                                      <span className={`inline-block px-1.5 py-0.5 text-[9px] rounded font-bold w-fit ${req.requestType === 'sourcing' ? 'bg-amber-50 text-amber-800' : 'bg-indigo-50 text-indigo-800'}`}>
                                        {req.requestType === 'sourcing' ? '기성 소싱' : '디자인 기획 OEM'}
                                      </span>
                                      <span className="text-[9px] text-slate-500 font-bold bg-slate-100 p-0.5 rounded-md w-fit">
                                        인도: {req.tradeTerm === 'fob_buyer_clearance' ? 'FOB 상해 (바이어통관)' : '수입 대행 위탁'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-slate-900">{req.quantity.toLocaleString()}개</td>
                                  <td className="p-3 text-center">
                                    <span className={`inline-block px-2.5 py-1 rounded text-[10px] border font-bold ${getStatusBadgeStyle(req.status)}`}>
                                      {getStatusLabel(req.status, req.requestType)}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <select
                                        value={req.status}
                                        onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                                        className="text-[11px] p-1 border rounded bg-white font-extrabold focus:outline-none cursor-pointer"
                                      >
                                        <option value="pending">접수 완료</option>
                                        <option value="processing">소싱/기획중</option>
                                        <option value="quoted">제안 완료</option>
                                        <option value="success">발주 성공</option>
                                      </select>
                                      
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedRequest(req);
                                          setAdminSubTab('workspace');
                                          setAdminCostCNY(req.requestType === 'sourcing' ? 45 : 120);
                                        }}
                                        className="bg-slate-900 text-white hover:bg-slate-800 p-1.5 rounded font-black text-[10px] px-2.5"
                                      >
                                        작업
                                      </button>
                                      
                                      {/* 통합 DB 행 내 개별 삭제 기능 */}
                                      <button
                                        type="button"
                                        onClick={(e) => handleDeleteRequest(req.id, e)}
                                        className="text-slate-400 hover:text-red-600 p-1.5 rounded border border-slate-200 bg-white"
                                        title="의뢰 영구 삭제"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}

              </div>
            )}
          </div>
        )}

      </main>

      {/* =========================================
          MODAL: 1차 견적서 팝업 (바이어 선택 조건에 따라 관세, 부가세, 한국 수입비용 유무 동적 연출)
          ========================================= */}
      {showQuoteModal && generatedQuote && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            
            {/* 모달 상부 타이틀: "1차 견적서" 로 정제 */}
            <div className="bg-slate-900 text-white p-4 px-6 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span className="font-extrabold text-sm">1차 견적서</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowQuoteModal(false)}
                className="text-slate-400 hover:text-white text-xs font-black bg-slate-800 px-3 py-1.5 rounded-lg"
              >
                닫기
              </button>
            </div>

            {/* 견적서 지면 본부 */}
            <div ref={quotePdfRef} className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6 text-xs text-slate-600 font-semibold bg-white">
              
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">1차 견적서</h2>
                  <p className="text-xs text-slate-400 font-mono font-bold mt-1">인보이스 코드: {generatedQuote.quoteId}</p>
                </div>
                <div className="text-right text-xs leading-relaxed font-semibold">
                  <p className="font-black text-slate-900 text-sm">SPMS B2B 사업부</p>
                </div>
              </div>

              {/* 바이어 정보 */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 font-semibold leading-relaxed">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Buyer (수신 바이어 정보)</p>
                  <p className="font-black text-sm text-slate-900 mt-1">{generatedQuote.vendorName}</p>
                  <p className="text-slate-700 mt-0.5">담당자: {generatedQuote.manager} 귀하</p>
                  {generatedQuote.email && <p className="text-slate-600">이메일: {generatedQuote.email}</p>}
                  {generatedQuote.phone && <p className="text-slate-600">연락처: {generatedQuote.phone}</p>}
                  {generatedQuote.kakao && <p className="text-indigo-700 font-bold">카카오톡 ID: {generatedQuote.kakao}</p>}
                  {generatedQuote.wechat && <p className="text-emerald-700 font-bold">위챗 ID: {generatedQuote.wechat}</p>}
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date (제안 일자)</p>
                  <p className="font-black text-slate-900 mt-1">{new Date().toLocaleDateString('ko-KR')}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-4">의뢰 인도 조건</p>
                  <p className="font-extrabold text-indigo-700">
                    {generatedQuote.tradeTerm === 'fob_buyer_clearance' 
                      ? '1. FOB상해 조건 (바이어 직접 수입통관)' 
                      : '2. FOB상해 ➔ SPMS 일괄 수입통관 대행'}
                  </p>
                </div>
              </div>

              {/* 바이어 요청 스펙 및 이미지 명시 카드 레이아웃 */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-black text-slate-900 block">■ 바이어 의뢰 상세 규격 및 레퍼런스 이미지 (Requested Specifications & reference Images)</span>
                
                <div className="bg-white p-3 rounded-lg border text-[11px] leading-relaxed text-slate-700 font-semibold space-y-2">
                  <div>
                    <strong className="text-slate-900 block mb-1">상세 의뢰 사양 및 요건:</strong>
                    <p className="whitespace-pre-line text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">{generatedQuote.specs}</p>
                  </div>

                  {/* 바이어가 등록한 이미지 또는 링크 카드 표출 */}
                  {((generatedQuote.localImages && generatedQuote.localImages.length > 0) || generatedQuote.imageUrl) && (
                    <div className="pt-2">
                      <strong className="text-slate-900 block mb-2">첨부 레퍼런스 이미지:</strong>
                      
                      {generatedQuote.localImages && generatedQuote.localImages.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                          {generatedQuote.localImages.map((imgSrc, idx) => (
                            <div key={idx} className="relative aspect-square border rounded-lg overflow-hidden bg-slate-50 shadow-sm max-h-32 max-w-[120px]">
                              <img src={imgSrc} alt={`견적서첨부이미지-${idx}`} className="w-full h-full object-cover" />
                              <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[8px] font-black px-1 py-0.5 rounded">
                                실물 사진 {idx + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : generatedQuote.imageUrl ? (
                        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border max-w-md">
                          <div className="w-14 h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0 border">
                            <img src={generatedQuote.imageUrl} alt="참조 링크 이미지" className="w-full h-full object-cover" />
                          </div>
                          <div className="overflow-hidden space-y-1">
                            <span className="text-[10px] text-slate-400 block font-bold">인터넷 쇼핑몰 이미지 링크</span>
                            <a href={generatedQuote.imageUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline truncate block text-[11px] font-bold">
                              {generatedQuote.imageUrl}
                            </a>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* 무역 원가 역산 한화 산정 명세: 타이틀 수정 및 문구 제거 */}
              <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 space-y-2.5">
                <span className="text-xs font-black text-indigo-950 flex items-center gap-1">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  실시간 환율 변환 견적 상세 내역
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-700 font-bold leading-relaxed">
                  <div className="space-y-1 bg-white p-2.5 rounded border border-indigo-100/60">
                    <span className="text-[10px] text-slate-400 block font-bold">1. 원가 및 수출입 비용 (개당 계산)</span>
                    <div>• 중국공장 원가: <strong className="text-slate-900">¥ {generatedQuote.costCNY.toLocaleString()} CNY</strong></div>
                    <div>• 네이버 적용 환율: <strong className="text-slate-900">₩ {generatedQuote.exchangeRate} 원</strong></div>
                    <div className="border-t border-slate-100 my-1 pt-1"></div>
                    <div>• 원화 환산 원장가: <strong className="text-slate-900">₩ {generatedQuote.costInKRW.toLocaleString()} 원</strong></div>
                    <div>• 중국 FOB 수출비용 ({generatedQuote.chinaFobExportRate}%): <strong className="text-slate-900">₩ {Math.round(generatedQuote.costInKRW * (generatedQuote.chinaFobExportRate/100)).toLocaleString()} 원</strong></div>
                    
                    {generatedQuote.tradeTerm === 'fob_buyer_clearance' ? (
                      <div className="text-amber-700 font-extrabold mt-1">• 한국 수입 비용: 해당 없음 (FOB 거래 바이어 자납)</div>
                    ) : (
                      <>
                        <div>• 한국 수입 부대비용 ({generatedQuote.koreaImportRate}%): <strong className="text-slate-900">₩ {Math.round(generatedQuote.costInKRW * (generatedQuote.koreaImportRate/100)).toLocaleString()} 원</strong></div>
                        <div className="text-indigo-600 font-extrabold mt-0.5">• 환율 적용 원가합산: ₩ {generatedQuote.appliedCostKRW.toLocaleString()} 원</div>
                      </>
                    )}
                  </div>

                  <div className="space-y-1 bg-white p-2.5 rounded border border-indigo-100/60">
                    <span className="text-[10px] text-slate-400 block font-bold">2. 마진 적용 공급 및 납세액 (총액 계산)</span>
                    <div>• SPMS 대행 마진율: <strong className="text-slate-900">{generatedQuote.marginRate} %</strong></div>
                    <div>• 최종 공급 단가: <strong className="text-indigo-600">₩ {generatedQuote.unitPrice.toLocaleString()} 원</strong></div>
                    <div className="border-t border-slate-100 my-1 pt-1"></div>
                    <div>• 공급가액 합계: <strong className="text-slate-900">₩ {generatedQuote.supplyTotal.toLocaleString()} 원</strong> (단가 × {generatedQuote.quantity.toLocaleString()}개)</div>
                    <div>
                      • 상품별 관세 ({generatedQuote.tariffRate}%):{' '}
                      <strong className={(generatedQuote.isSmallVolumeDirectPay || generatedQuote.tradeTerm === 'fob_buyer_clearance') ? "text-amber-700" : "text-slate-900"}>
                        {generatedQuote.tradeTerm === 'fob_buyer_clearance' 
                          ? "해당없음 (바이어 자가 수입통관)" 
                          : generatedQuote.isSmallVolumeDirectPay 
                            ? "세관 직접 납부 (₩0 청구)" 
                            : `₩ ${generatedQuote.tariffTotal.toLocaleString()} 원`}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* 제품 가격 단가 테이블 */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-800 font-black border-b border-slate-200">
                    <tr>
                      <th className="p-3">제안 품목 및 규격 명세</th>
                      <th className="p-3 text-right">의뢰 수량</th>
                      <th className="p-3 text-right">개당 공급가 (원)</th>
                      <th className="p-3 text-right">공급 총합액 (원)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    <tr>
                      <td className="p-3">
                        <strong className="text-slate-900">{generatedQuote.productName}</strong>
                        <p className="text-[10px] text-slate-400 mt-1 font-normal">
                          ※ 중국 제조사 공장 원가 ¥{generatedQuote.costCNY.toLocaleString()} 기반 (네이버 환율 {generatedQuote.exchangeRate} 적용)
                        </p>
                      </td>
                      <td className="p-3 text-right font-mono font-bold">{generatedQuote.quantity.toLocaleString()} 개</td>
                      <td className="p-3 text-right font-mono font-bold">{generatedQuote.unitPrice.toLocaleString()} 원</td>
                      <td className="p-3 text-right font-mono font-black text-slate-900">{generatedQuote.supplyTotal.toLocaleString()} 원</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 결제 조건 및 생산 납기 리드타임 정보 명세 */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <span className="text-xs font-black text-slate-900 block">■ 결제 조건 및 생산 납기 명세 (Terms of Payment & Lead Time)</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700 leading-relaxed">
                  <div className="space-y-1 bg-white p-2.5 rounded border">
                    <span className="text-[10px] text-slate-400 block font-bold">결제 조건 (Payment Terms)</span>
                    <div className="text-indigo-600 font-extrabold">• 선금 30% / 출고 전 잔금 70% 정산</div>
                    <div className="border-t my-1 pt-1"></div>
                    <div>• 계약금 (선금 30%): <strong className="text-slate-900">₩ {generatedQuote.depositKRW?.toLocaleString()} 원</strong> <span className="text-[10px] text-slate-400">(입금 확인 후 생산 즉시 착수)</span></div>
                    <div>• 인도금 (잔금 70%): <strong className="text-slate-900">₩ {generatedQuote.balanceKRW?.toLocaleString()} 원</strong> <span className="text-[10px] text-slate-400">(출고 전 정산 완료 조건)</span></div>
                  </div>

                  <div className="space-y-1 bg-white p-2.5 rounded border md:border-l pl-4">
                    <span className="text-[10px] text-slate-400 block font-bold">생산 딜리버리 (Lead Time)</span>
                    <div className="text-indigo-600 font-extrabold">• 생산 리드타임: 선금 입금 후 약 {generatedQuote.leadTimeWeeks}주 소요</div>
                    <div className="border-t my-1 pt-1"></div>
                    <p className="text-[10px] text-slate-400 font-normal leading-relaxed">
                      ※ 본 납기는 원부자재 수급 및 제조사 스케줄 등에 따라 연장될 수 있으며 위챗 또는 메신저를 통해 실시간 소통하여 공유됩니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 최종 토탈 계산 및 관부가세 책정 내역 */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                
                {/* 수출입 운임 비용 책정 상세 고지 */}
                <div className="w-full md:w-1/2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-normal font-bold">
                  <span className="block font-extrabold mb-1">■ 수출입 통관 및 대행 물류비용</span>
                  {generatedQuote.tradeTerm === 'fob_buyer_clearance' ? (
                    <div className="text-indigo-950">
                      상해 항구 선적 인도(FOB Shanghai) 조건에 따른 견적서입니다. 한국 세관 수입 관부가세, 항구 창고료 및 국내 화물 내륙운송비는 바이어가 통관 세관 및 관세사로 실비로 직접 부담 및 납부하셔야 합니다.
                    </div>
                  ) : generatedQuote.isSmallVolumeDirectPay ? (
                    <div className="text-red-700 font-black">
                      ⚠️ 본 건은 물량이 협소한 소량 주문 조건으로 판단되어, 세관 관부가세 및 수출입 대행비가 견적 총합에 포함되지 않았습니다. (바이어 직접 실비 부담 조건)
                    </div>
                  ) : (
                    <div>
                      중국 FOB 수출비용율 {generatedQuote.chinaFobExportRate}% 및 한국 수입 비용율 {generatedQuote.koreaImportRate}%가 적용되어 환율 적용원가에 전액 합산 반영되었습니다.
                    </div>
                  )}
                </div>

                <div className="w-full md:w-1/2 bg-slate-900 text-white p-4 rounded-xl space-y-2 text-right font-semibold shrink-0">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">공급 가격 총합</span>
                    <span>₩ {generatedQuote.supplyTotal.toLocaleString()} 원</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">상품 관세 총액 ({generatedQuote.tradeTerm === 'fob_buyer_clearance' ? '바이어 부담' : generatedQuote.isSmallVolumeDirectPay ? '바이어 직접납부' : `${generatedQuote.tariffRate}%`})</span>
                    <span>
                      {generatedQuote.isSmallVolumeDirectPay || generatedQuote.tradeTerm === 'fob_buyer_clearance' ? '₩0 원' : `₩ ${generatedQuote.tariffTotal.toLocaleString()} 원`}
                    </span>
                  </div>
                  <div className="border-t border-slate-800 my-2 pt-2 flex justify-between items-center">
                    <span className="font-extrabold text-emerald-400">최종 청구 총 합계액</span>
                    <span className="text-md md:text-lg font-black text-emerald-400">
                      ₩ {generatedQuote.totalPrice.toLocaleString()} 원
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-black uppercase text-right tracking-wider">
                    {generatedQuote.tradeTerm === 'fob_buyer_clearance' ? '* 한국 부가가치세(VAT) 면세/비대상 (FOB 수출거래)' : '* 부가세 별도 (VAT Separate)'}
                  </div>
                </div>
              </div>

              {/* 조항 및 법적 고지사항 (신규 변동 문구 추가) */}
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1.5 font-semibold leading-relaxed">
                <p className="text-red-600 font-black flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  ※ 위 견적은 시장상황에 따라 수시로 변동이 가능합니다.
                </p>
                <div className="border-t border-amber-200/50 my-1"></div>
                <p className="font-extrabold flex items-center gap-1">
                  SPMS 글로벌 수입 위탁 거래 공지사항:
                </p>
                <ol className="list-decimal pl-4 space-y-0.5 text-amber-800">
                  {generatedQuote.tradeTerm === 'fob_buyer_clearance' ? (
                    <>
                      <li>본 거래는 상해 선적 인도(FOB Shanghai) 조건으로서, 세관 수입 신고 및 관부가세 일체는 수입주체인 바이어(귀사)가 직접 부담 및 면책 처리합니다.</li>
                      <li>생산지 공장 출고가 및 중국 내륙 수출 선적 제비용 일체가 원화 단가에 포함되어 산정되었습니다.</li>
                    </>
                  ) : (
                    <>
                      <li>본 견적 금액은 대한민국 부가세(VAT) 10%가 포함되지 않은 부가세 별도 금액입니다.</li>
                      <li>소량 화물의 경우, 정식 계약 단계 시 인천항 입항 세관 부과 금액 및 국내 배송 운임 실비가 별도 청구될 수 있습니다.</li>
                      <li>본 가격은 중국 등 최적 매칭 제조 공장의 출고가에 1차 수수료(마진)를 더한 가산 금액입니다.</li>
                    </>
                  )}
                </ol>
              </div>

            </div>

            {/* PDF 다운로드 인터페이스 */}
            <div className="bg-slate-50 p-6 border-t border-slate-200 shrink-0 text-xs">
              <button
                type="button"
                onClick={handleDownloadQuotePdf}
                disabled={isDownloadingPdf}
                className={`w-full font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md ${isDownloadingPdf ? 'bg-slate-300 text-slate-500 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
              >
                <Download className="w-4 h-4" />
                {isDownloadingPdf ? 'PDF 문서 생성 중...' : '1차 견적서 PDF 다운로드'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 푸터 */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 px-6 text-center text-xs text-slate-400 font-semibold">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="font-bold text-slate-600">© 2026 SPMS Smart Sourcing Portal. All rights reserved.</p>
          <p>중국 및 다국적 원가 마진 정밀 산정 및 무역 데이터 연동 자동화 시스템</p>
        </div>
      </footer>
    </div>
  );
}
