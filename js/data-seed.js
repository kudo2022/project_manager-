/**
 * ITPM Dashboard - Initial Seed Dataset
 * Matches the reference dashboard metrics, project progress, resource utilization,
 * status distribution (18 completed, 12 in_progress, 7 not_started = 37 tasks),
 * and the exact 6 overdue tasks relative to reference date 08/10/2025.
 */

window.ITPM = window.ITPM || {};

window.ITPM.SEED_DATA = {
  // Reference "Today" date shown in the dashboard header (08/10/2025)
  referenceDate: "2025-10-08",

  // Average project progress override for the donut chart (69% in reference screenshot)
  avgProgressOverride: 69,

  // KPI Header configuration supporting both exact reference screenshot display and dynamic calculation
  kpiOverride: {
    totalProjects: 7,
    totalTasks: 37,
    completedHeaderValue: 37,
    useCalculated: false
  },

  // 7 IT Projects matching TIẾN ĐỘ DỰ ÁN (CTPro07 down to CTPro01)
  projects: [
    {
      id: "CTPro07",
      code: "CTPro07",
      name: "Hệ thống AI Helpdesk & Chatbot Nội bộ",
      department: "AI & Automation",
      manager: "Đề Gi",
      progress: 11,
      startDate: "2025-08-01",
      endDate: "2025-12-30",
      status: "in_progress",
      budget: "1,850,000,000 ₫",
      description: "Xây dựng trợ lý ảo AI hỗ trợ giải đáp IT Helpdesk tự động và tra cứu tri thức nội bộ (RAG)."
    },
    {
      id: "CTPro06",
      code: "CTPro06",
      name: "Nâng cấp Hạ tầng Cloud & Kubernetes",
      department: "Cloud & DevOps",
      manager: "Kỳ Co",
      progress: 41,
      startDate: "2025-05-01",
      endDate: "2025-11-15",
      status: "in_progress",
      budget: "3,200,000,000 ₫",
      description: "Chuyển đổi kiến trúc Microservices lên cụm Kubernetes Multi-AZ và tự động hóa đường ống CI/CD."
    },
    {
      id: "CTPro05",
      code: "CTPro05",
      name: "Hệ thống Giám sát An ninh mạng SOC",
      department: "Cyber Security",
      manager: "An Nhơn",
      progress: 83,
      startDate: "2025-01-10",
      endDate: "2025-03-11",
      status: "in_progress",
      budget: "2,400,000,000 ₫",
      description: "Triển khai trung tâm giám sát an toàn thông tin SOC 24/7, SIEM, WAF và kiểm thử xâm nhập."
    },
    {
      id: "CTPro04",
      code: "CTPro04",
      name: "Phần mềm Quản trị Doanh nghiệp ERP Core",
      department: "Enterprise Apps",
      manager: "Phù Cát",
      progress: 93,
      startDate: "2024-11-01",
      endDate: "2025-03-11",
      status: "in_progress",
      budget: "4,500,000,000 ₫",
      description: "Phát triển và tích hợp các phân hệ Tài chính - Kế toán, Mua hàng, Kho vận và Nhân sự cốt lõi."
    },
    {
      id: "CTPro03",
      code: "CTPro03",
      name: "Cổng Thông tin Khách hàng & CRM",
      department: "Digital Web",
      manager: "Qui Nhơn",
      progress: 100,
      startDate: "2024-09-01",
      endDate: "2025-02-28",
      status: "completed",
      budget: "1,600,000,000 ₫",
      description: "Nền tảng quản trị quan hệ khách hàng đa kênh và cổng dịch vụ tự phục vụ trực tuyến."
    },
    {
      id: "CTPro02",
      code: "CTPro02",
      name: "Kho Dữ liệu Tập trung Data Warehouse",
      department: "Data Engineering",
      manager: "Cát Tiến",
      progress: 100,
      startDate: "2024-08-15",
      endDate: "2025-01-30",
      status: "completed",
      budget: "2,100,000,000 ₫",
      description: "Xây dựng đường ống ETL/ELT, chuẩn hóa Data Lakehouse và hệ thống báo cáo BI điều hành."
    },
    {
      id: "CTPro01",
      code: "CTPro01",
      name: "Ứng dụng Mobile Nội bộ Enterprise",
      department: "Mobile Team",
      manager: "Đập Đá",
      progress: 100,
      startDate: "2024-06-01",
      endDate: "2024-12-20",
      status: "completed",
      budget: "1,250,000,000 ₫",
      description: "Ứng dụng di động đa nền tảng phục vụ phê duyệt quy trình, chấm công và truyền thông nội bộ."
    }
  ],

  // 7 Resources/Teams matching SỬ DỤNG NGUỒN LỰC in exact order from top to bottom
  resources: [
    { id: "res-1", name: "Phù Cát", role: "Backend & ERP Team", utilization: 14 },
    { id: "res-2", name: "Kỳ Co", role: "Cloud & DevOps Team", utilization: 27 },
    { id: "res-3", name: "Đập Đá", role: "SysAdmin & Infra", utilization: 33 },
    { id: "res-4", name: "An Nhơn", role: "Security & SOC Team", utilization: 50 },
    { id: "res-5", name: "Qui Nhơn", role: "Fullstack & CRM Team", utilization: 50 },
    { id: "res-6", name: "Đề Gi", role: "QA & Integration Team", utilization: 17 },
    { id: "res-7", name: "Cát Tiến", role: "Data & BI Team", utilization: 40 }
  ],

  /**
   * 37 Tasks (CTax0001 to CTax0037)
   * - Status counts: 18 "completed", 12 "in_progress", 7 "not_started" (Total = 37)
   * - Overdue tasks on 2025-10-08: Exactly 6 tasks (CTax0013, CTax0014, CTax0018, CTax0020, CTax0021, CTax0023)
   * - Sum of task progress: 18*100 + (90+85+80+75+90+50 + 60+55+50+45+40+35) + 7*0 = 2555 / 37 = 69.05% (~69%)
   */
  tasks: [
    // =========================================================================
    // CTPro01: Ứng dụng Mobile Nội bộ Enterprise (4 tasks - All Completed)
    // =========================================================================
    {
      id: "CTax0001",
      code: "CTax0001",
      projectId: "CTPro01",
      title: "Thiết kế UI/UX & Prototype ứng dụng Mobile Enterprise",
      assignee: "Qui Nhơn",
      startDate: "2024-06-05",
      endDate: "2024-07-20",
      progress: 100,
      status: "completed",
      priority: "Cao",
      estimatedHours: 120
    },
    {
      id: "CTax0002",
      code: "CTax0002",
      projectId: "CTPro01",
      title: "Phát triển module Xác thực SSO & Sinh trắc học",
      assignee: "Đập Đá",
      startDate: "2024-07-22",
      endDate: "2024-09-15",
      progress: 100,
      status: "completed",
      priority: "Cao",
      estimatedHours: 160
    },
    {
      id: "CTax0003",
      code: "CTax0003",
      projectId: "CTPro01",
      title: "Xây dựng phân hệ Phê duyệt điện tử & Thông báo Push",
      assignee: "Phù Cát",
      startDate: "2024-09-16",
      endDate: "2024-11-10",
      progress: 100,
      status: "completed",
      priority: "Trung bình",
      estimatedHours: 140
    },
    {
      id: "CTax0004",
      code: "CTax0004",
      projectId: "CTPro01",
      title: "Kiểm thử tương thích iOS/Android & Phát hành MDM",
      assignee: "Đề Gi",
      startDate: "2024-11-12",
      endDate: "2024-12-20",
      progress: 100,
      status: "completed",
      priority: "Cao",
      estimatedHours: 96
    },

    // =========================================================================
    // CTPro02: Kho Dữ liệu Tập trung Data Warehouse (4 tasks - All Completed)
    // =========================================================================
    {
      id: "CTax0005",
      code: "CTax0005",
      projectId: "CTPro02",
      title: "Thiết kế kiến trúc Data Lakehouse & Data Modeling",
      assignee: "Cát Tiến",
      startDate: "2024-08-15",
      endDate: "2024-09-30",
      progress: 100,
      status: "completed",
      priority: "Cao",
      estimatedHours: 150
    },
    {
      id: "CTax0006",
      code: "CTax0006",
      projectId: "CTPro02",
      title: "Xây dựng đường ống dữ liệu ETL Apache Airflow",
      assignee: "Cát Tiến",
      startDate: "2024-10-01",
      endDate: "2024-11-20",
      progress: 100,
      status: "completed",
      priority: "Cao",
      estimatedHours: 180
    },
    {
      id: "CTax0007",
      code: "CTax0007",
      projectId: "CTPro02",
      title: "Chuẩn hóa Master Data & Kiểm soát chất lượng dữ liệu",
      assignee: "Phù Cát",
      startDate: "2024-11-21",
      endDate: "2024-12-28",
      progress: 100,
      status: "completed",
      priority: "Trung bình",
      estimatedHours: 110
    },
    {
      id: "CTax0008",
      code: "CTax0008",
      projectId: "CTPro02",
      title: "Triển khai Dashboard BI Báo cáo Quản trị điều hành",
      assignee: "Cát Tiến",
      startDate: "2025-01-02",
      endDate: "2025-01-30",
      progress: 100,
      status: "completed",
      priority: "Cao",
      estimatedHours: 100
    },

    // =========================================================================
    // CTPro03: Cổng Thông tin Khách hàng & CRM (4 tasks - All Completed)
    // =========================================================================
    {
      id: "CTax0009",
      code: "CTax0009",
      projectId: "CTPro03",
      title: "Phát triển giao diện Customer Portal (React/Next.js)",
      assignee: "Qui Nhơn",
      startDate: "2024-09-01",
      endDate: "2024-10-25",
      progress: 100,
      status: "completed",
      priority: "Cao",
      estimatedHours: 160
    },
    {
      id: "CTax0010",
      code: "CTax0010",
      projectId: "CTPro03",
      title: "Xây dựng phân hệ Quản lý Lead & Pipeline Bán hàng",
      assignee: "Qui Nhơn",
      startDate: "2024-10-26",
      endDate: "2024-12-15",
      progress: 100,
      status: "completed",
      priority: "Cao",
      estimatedHours: 175
    },
    {
      id: "CTax0011",
      code: "CTax0011",
      projectId: "CTPro03",
      title: "Tích hợp tổng đài VoIP Omnichannel & Email Automation",
      assignee: "Kỳ Co",
      startDate: "2024-12-16",
      endDate: "2025-01-31",
      progress: 100,
      status: "completed",
      priority: "Trung bình",
      estimatedHours: 130
    },
    {
      id: "CTax0012",
      code: "CTax0012",
      projectId: "CTPro03",
      title: "Kiểm thử nghiệm thu UAT & Go-live hệ thống CRM",
      assignee: "Đề Gi",
      startDate: "2025-02-01",
      endDate: "2025-02-28",
      progress: 100,
      status: "completed",
      priority: "Cao",
      estimatedHours: 88
    },

    // =========================================================================
    // CTPro04: Phần mềm Quản trị Doanh nghiệp ERP Core (6 tasks: 3 Completed, 3 Overdue In-Progress)
    // =========================================================================
    {
      id: "CTax0013",
      code: "CTax0013",
      projectId: "CTPro04",
      title: "Tích hợp phân hệ Kế toán & Thuế điện tử",
      assignee: "Đề Gi",
      startDate: "2025-01-15",
      endDate: "2025-03-04",
      progress: 90,
      status: "in_progress",
      priority: "Cao",
      isOverduePinned: true,
      estimatedHours: 200
    },
    {
      id: "CTax0014",
      code: "CTax0014",
      projectId: "CTPro04",
      title: "Kiểm thử hiệu năng & Bảo mật API ERP",
      assignee: "Phù Cát",
      startDate: "2025-01-20",
      endDate: "2025-03-06",
      progress: 85,
      status: "in_progress",
      priority: "Cao",
      isOverduePinned: true,
      estimatedHours: 140
    },
    {
      id: "CTax0015",
      code: "CTax0015",
      projectId: "CTPro04",
      title: "Phân tích nghiệp vụ & Thiết kế CSDL ERP Core",
      assignee: "Phù Cát",
      startDate: "2024-11-01",
      endDate: "2024-12-10",
      progress: 100,
      status: "completed",
      priority: "Cao",
      estimatedHours: 160
    },
    {
      id: "CTax0016",
      code: "CTax0016",
      projectId: "CTPro04",
      title: "Phát triển phân hệ Quản lý Nhân sự & Tính lương (HRM)",
      assignee: "Phù Cát",
      startDate: "2024-12-11",
      endDate: "2025-01-25",
      progress: 100,
      status: "completed",
      priority: "Cao",
      estimatedHours: 180
    },
    {
      id: "CTax0017",
      code: "CTax0017",
      projectId: "CTPro04",
      title: "Xây dựng Workflow Phê duyệt Ngân sách & Đề xuất mua sắm",
      assignee: "Qui Nhơn",
      startDate: "2025-01-10",
      endDate: "2025-02-20",
      progress: 100,
      status: "completed",
      priority: "Trung bình",
      estimatedHours: 120
    },
    {
      id: "CTax0018",
      code: "CTax0018",
      projectId: "CTPro04",
      title: "Đồng bộ dữ liệu Kho & Mua hàng tập trung",
      assignee: "Cát Tiến",
      startDate: "2025-02-01",
      endDate: "2025-03-11",
      progress: 80,
      status: "in_progress",
      priority: "Trung bình",
      isOverduePinned: true,
      estimatedHours: 150
    },

    // =========================================================================
    // CTPro05: Hệ thống Giám sát An ninh mạng SOC (5 tasks: 2 Completed, 3 Overdue In-Progress)
    // =========================================================================
    {
      id: "CTax0019",
      code: "CTax0019",
      projectId: "CTPro05",
      title: "Thiết kế kiến trúc mạng Zero Trust & Phân vùng DMZ",
      assignee: "An Nhơn",
      startDate: "2025-01-10",
      endDate: "2025-02-05",
      progress: 100,
      status: "completed",
      priority: "Khẩn cấp",
      estimatedHours: 120
    },
    {
      id: "CTax0020",
      code: "CTax0020",
      projectId: "CTPro05",
      title: "Cấu hình SIEM & Cảnh báo xâm nhập tự động",
      assignee: "An Nhơn",
      startDate: "2025-02-05",
      endDate: "2025-03-11",
      progress: 75,
      status: "in_progress",
      priority: "Khẩn cấp",
      isOverduePinned: true,
      estimatedHours: 160
    },
    {
      id: "CTax0021",
      code: "CTax0021",
      projectId: "CTPro05",
      title: "Triển khai tường lửa WAF & Zero Trust VPN",
      assignee: "Đập Đá",
      startDate: "2025-01-25",
      endDate: "2025-03-07",
      progress: 90,
      status: "in_progress",
      priority: "Cao",
      isOverduePinned: true,
      estimatedHours: 140
    },
    {
      id: "CTax0022",
      code: "CTax0022",
      projectId: "CTPro05",
      title: "Triển khai EDR Agent & Giám sát thiết bị đầu cuối",
      assignee: "An Nhơn",
      startDate: "2025-01-18",
      endDate: "2025-02-22",
      progress: 100,
      status: "completed",
      priority: "Cao",
      estimatedHours: 110
    },
    {
      id: "CTax0023",
      code: "CTax0023",
      projectId: "CTPro05",
      title: "Pentest & Đánh giá lỗ hổng bảo mật định kỳ",
      assignee: "Đề Gi",
      startDate: "2025-02-10",
      endDate: "2025-03-07",
      progress: 50,
      status: "in_progress",
      priority: "Cao",
      isOverduePinned: true,
      estimatedHours: 130
    },

    // =========================================================================
    // CTPro06: Nâng cấp Hạ tầng Cloud & Kubernetes (7 tasks: 1 Completed, 4 Active In-Progress, 2 Not Started)
    // =========================================================================
    {
      id: "CTax0024",
      code: "CTax0024",
      projectId: "CTPro06",
      title: "Khảo sát hạ tầng On-premise & Thiết kế Cloud Landing Zone",
      assignee: "Kỳ Co",
      startDate: "2025-05-01",
      endDate: "2025-06-30",
      progress: 100,
      status: "completed",
      priority: "Cao",
      estimatedHours: 140
    },
    {
      id: "CTax0025",
      code: "CTax0025",
      projectId: "CTPro06",
      title: "Khởi tạo cụm Kubernetes Multi-AZ bằng Terraform (IaC)",
      assignee: "Kỳ Co",
      startDate: "2025-07-01",
      endDate: "2025-10-22",
      progress: 60,
      status: "in_progress",
      priority: "Cao",
      estimatedHours: 160
    },
    {
      id: "CTax0026",
      code: "CTax0026",
      projectId: "CTPro06",
      title: "Xây dựng đường ống GitOps CI/CD với ArgoCD & GitLab",
      assignee: "Kỳ Co",
      startDate: "2025-08-01",
      endDate: "2025-10-28",
      progress: 55,
      status: "in_progress",
      priority: "Cao",
      estimatedHours: 150
    },
    {
      id: "CTax0027",
      code: "CTax0027",
      projectId: "CTPro06",
      title: "Cấu hình Service Mesh Istio & Giám sát Prometheus/Grafana",
      assignee: "Đập Đá",
      startDate: "2025-08-15",
      endDate: "2025-11-02",
      progress: 50,
      status: "in_progress",
      priority: "Trung bình",
      estimatedHours: 130
    },
    {
      id: "CTax0028",
      code: "CTax0028",
      projectId: "CTPro06",
      title: "Chuyển đổi Container hóa các dịch vụ Core Microservices",
      assignee: "Phù Cát",
      startDate: "2025-09-01",
      endDate: "2025-11-08",
      progress: 45,
      status: "in_progress",
      priority: "Cao",
      estimatedHours: 170
    },
    {
      id: "CTax0029",
      code: "CTax0029",
      projectId: "CTPro06",
      title: "Diễn tập Disaster Recovery (DR) & Tự động Failover",
      assignee: "Đập Đá",
      startDate: "2025-10-15",
      endDate: "2025-11-12",
      progress: 0,
      status: "not_started",
      priority: "Cao",
      estimatedHours: 96
    },
    {
      id: "CTax0030",
      code: "CTax0030",
      projectId: "CTPro06",
      title: "Tối ưu chi phí FinOps & Nghiệm thu hạ tầng Cloud",
      assignee: "Kỳ Co",
      startDate: "2025-10-20",
      endDate: "2025-11-15",
      progress: 0,
      status: "not_started",
      priority: "Trung bình",
      estimatedHours: 80
    },

    // =========================================================================
    // CTPro07: Hệ thống AI Helpdesk & Chatbot Nội bộ (7 tasks: 2 Active In-Progress, 5 Not Started)
    // =========================================================================
    {
      id: "CTax0031",
      code: "CTax0031",
      projectId: "CTPro07",
      title: "Thu thập dữ liệu tri thức IT & Xây dựng Vector Database",
      assignee: "Cát Tiến",
      startDate: "2025-08-05",
      endDate: "2025-10-25",
      progress: 40,
      status: "in_progress",
      priority: "Cao",
      estimatedHours: 140
    },
    {
      id: "CTax0032",
      code: "CTax0032",
      projectId: "CTPro07",
      title: "Phát triển pipeline RAG & Tinh chỉnh mô hình LLM tiếng Việt",
      assignee: "Đề Gi",
      startDate: "2025-09-01",
      endDate: "2025-11-05",
      progress: 35,
      status: "in_progress",
      priority: "Cao",
      estimatedHours: 180
    },
    {
      id: "CTax0033",
      code: "CTax0033",
      projectId: "CTPro07",
      title: "Xây dựng Backend API Gateway kết nối Chatbot đa kênh",
      assignee: "Phù Cát",
      startDate: "2025-10-12",
      endDate: "2025-11-18",
      progress: 0,
      status: "not_started",
      priority: "Cao",
      estimatedHours: 120
    },
    {
      id: "CTax0034",
      code: "CTax0034",
      projectId: "CTPro07",
      title: "Tích hợp tự động tạo Ticket ITSM & Phân luồng sự cố",
      assignee: "Qui Nhơn",
      startDate: "2025-10-18",
      endDate: "2025-11-28",
      progress: 0,
      status: "not_started",
      priority: "Trung bình",
      estimatedHours: 110
    },
    {
      id: "CTax0035",
      code: "CTax0035",
      projectId: "CTPro07",
      title: "Thiết kế giao diện Widget Chat & Bảng điều khiển Agent",
      assignee: "Qui Nhơn",
      startDate: "2025-10-25",
      endDate: "2025-12-08",
      progress: 0,
      status: "not_started",
      priority: "Trung bình",
      estimatedHours: 100
    },
    {
      id: "CTax0036",
      code: "CTax0036",
      projectId: "CTPro07",
      title: "Kiểm thử bảo mật Prompt Injection & Đánh giá độ chính xác AI",
      assignee: "An Nhơn",
      startDate: "2025-11-15",
      endDate: "2025-12-20",
      progress: 0,
      status: "not_started",
      priority: "Cao",
      estimatedHours: 96
    },
    {
      id: "CTax0037",
      code: "CTax0037",
      projectId: "CTPro07",
      title: "Đào tạo người dùng nội bộ & Triển khai Go-live AI Helpdesk",
      assignee: "Đề Gi",
      startDate: "2025-12-01",
      endDate: "2025-12-30",
      progress: 0,
      status: "not_started",
      priority: "Thấp",
      estimatedHours: 72
    }
  ]
};
