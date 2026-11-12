# Kiểm toán đo lường sản phẩm S-Club — EXE201

Ngày kiểm toán: 11/11/2026 (Asia/Bangkok). Mốc mã nguồn: `5d7dee9`. Website trong phạm vi báo cáo: https://sclub.io.vn.

## Kiểm toán mã nguồn

Đã rà soát điểm khởi tạo, định tuyến, auth, chọn/tạo/gia nhập CLB, subscription/PayOS, Google Docs/Sheets/Forms và quyền Google, Trello/task, lịch sự kiện, tài chính/quỹ, chat, thông báo, Admin Analytics và tài liệu trong repo. Tìm toàn repo các lời gọi GA4, wrapper thanh toán, `dataLayer` và dấu vết các SDK đo lường khác. Sáu tên dưới đây có lời gọi thực trong mã ứng dụng. Các tham số chỉ được ghi theo tên trường và kiểu giá trị.

- [index.html](index.html#L11-L24) tải Google tag, tạo hàng đợi `dataLayer` và cấu hình `send_page_view: false`. `gtag('js', …)` và `gtag('config', …)` là lệnh khởi tạo. Cài đặt Enhanced Measurement, key events và bộ lọc dữ liệu của property chưa được xác minh. Tự động theo dõi browser history có thể tạo page view song song với tracker thủ công. [GA4.md](GA4.md#L5-L26) mô tả bước xác minh cần thực hiện.
- [main.jsx:11–15](src/main.jsx#L11-L15) gắn tracker trong BrowserRouter. [App.jsx](src/App.jsx#L34-L50) đăng ký các route công khai, auth, admin và callback thanh toán. Dashboard gắn SubscriptionPanel tại [DashboardPage.jsx:331](src/pages/DashboardPage.jsx#L331). Tất cả sáu sự kiện có đường thực thi trong mã nguồn ứng dụng hiện tại, tùy điều kiện và khả năng gọi Google tag. Trạng thái bản triển khai production chưa được xác minh.
- Mọi payload đi qua [analytics.js:12–21](src/utils/analytics.js#L12-L21), lọc theo danh sách tham số cho phép và thêm `page_location` (origin + pathname hiện tại), `page_referrer` (URL pathname đã ghi nhận gần nhất trong bộ nhớ hoặc chuỗi rỗng). Các URL do helper tạo loại query/hash. Đường dẫn động vẫn có thể chứa ID tài nguyên. Tên CLB và mã đơn là trường riêng cần che khi công bố. Việc gọi được `gtag` có thể chỉ đưa payload vào hàng đợi.
- Mọi ghi nhận mock trong đợt này chạy trong bộ nhớ, với `gtag`, storage và API giả lập. Kết quả PASS cho sáu tên, lọc tham số, bỏ query/hash, chặn trùng liên tiếp theo trang/CLB, yêu cầu PAID cho hoàn tất thanh toán và chống trùng khi nạp lại module với sessionStorage giữ nguyên. Với Admin Analytics, mock xác nhận GET đúng endpoint, mặc định 30 ngày, trả `response.data` và từ chối kỳ vượt giới hạn. Các test này kiểm tra helper, không kiểm thử browser end-to-end cho từng handler. [ADMIN_INTEGRATION.md:61](ADMIN_INTEGRATION.md#L61) ghi nhận kiểm thử giao diện Admin bằng fixture trước đó, gồm kỳ lọc, chuyển đổi trên 100%, tăng trưởng null, doanh thu và subscriptions.

### Danh mục lời gọi GA4

Ký hiệu **URL chung** gồm `page_location` và `page_referrer` như trên. Mọi hàng có trạng thái **đã triển khai trong code, helper đã kiểm thử mock, chưa xác nhận GA4**.

| Event | Hàm, lời gọi và điều kiện kích hoạt | Payload thực | Sau backend thành công | Khả năng trùng hoặc bỏ sót |
|---|---|---|---|---|
| `page_view` | `AnalyticsTracker` effect khi mount hoặc đổi pathname tại [AnalyticsTracker.jsx:5–10](src/components/AnalyticsTracker.jsx#L5-L10), gọi `trackPageView` tại [analytics.js:24–30](src/utils/analytics.js#L24-L30). | `page_path`, `page_title` lấy lúc chạy, URL chung. | Không cần API. Có thể ghi nhận pathname trước khi nội dung được tải hoặc route chuyển hướng. | Bỏ lặp URL liên tiếp trong một lần tải. Đổi query/hash không kích hoạt effect. Quay lại sau route khác, reload, tab khác có thể ghi nhận mới. Enhanced Measurement có thể tạo trùng. |
| `user_login` | `LoginPage.handleLoginSuccess` tại [LoginPage.jsx:43–45](src/pages/LoginPage.jsx#L43-L45), được gọi sau login email tại dòng [80](src/pages/LoginPage.jsx#L80) hoặc Google tại dòng [108](src/pages/LoginPage.jsx#L108). Nút Google của trang Register gọi qua `handleGoogleCredential` tại [RegisterPage.jsx:96–114](src/pages/RegisterPage.jsx#L96-L114). | `method: email\|google`, URL chung. | Có. Sau API đăng nhập và lưu phiên với phản hồi có token/userId. | Helper không có khóa theo tài khoản hay phiên. Mỗi lần handler thành công có thể phát một event. Hai điểm vào Google cùng dùng tên này. |
| `user_register` | `RegisterPage.handleRegister` tại [RegisterPage.jsx:51–82](src/pages/RegisterPage.jsx#L51-L82), gọi tại dòng [80](src/pages/RegisterPage.jsx#L80) sau `await register`. | `method: email`, URL chung. | Có, sau khi Promise API đăng ký email resolve. | Helper không dedup. Mỗi handler đăng ký thành công có thể phát một event. Luồng Google ở Register phát `user_login`, nên số đăng ký GA4 chỉ phản ánh luồng email này. |
| `view_club` | Effect theo pathname tại [AnalyticsTracker.jsx:5–10](src/components/AnalyticsTracker.jsx#L5-L10) gọi `trackClubVisit` tại [analytics.js:33–40](src/utils/analytics.js#L33-L40). Cần token, `selectedClubId` trong storage và pathname ngoài danh sách loại trừ. | `club_id` từ storage, `club_name` khi có giá trị, URL chung. | Không chờ API xem CLB hay kiểm tra membership. Tạo/chọn CLB có thể gián tiếp dẫn tới effect sau điều hướng. | Nhớ CLB cuối trong bộ nhớ. Reset ở route loại trừ hoặc khi thiếu token/CLB. Reload/tab khác, đổi CLB rồi quay lại có thể phát lại. Chỉ đổi storage mà pathname giữ nguyên không kích hoạt effect. `/features` thiếu trong danh sách loại trừ. |
| `initiate_transaction` | `SubscriptionPanel.buy` kiểm tra quyền, chờ `createCheckout` và phiên còn hiện hành tại [SubscriptionPanel.jsx:319–345](src/components/SubscriptionPanel.jsx#L319-L345). | `transaction_id` chuỗi chữ số từ orderCode, `value` số hữu hạn từ amount, `currency: VND`, URL chung. | Có, sau phản hồi tạo checkout hợp lệ với helper. Không yêu cầu PENDING ở helper. | Dedupe theo tên event + mã đơn bằng Set và sessionStorage. Đơn khác, ngữ cảnh storage khác hoặc reload khi storage bị chặn có thể phát lại. |
| `complete_payment` | Ba điểm gọi trong SubscriptionPanel. Effect xử lý callback sau GET xác minh đơn, kể cả GET lại sau yêu cầu hủy ([191–219](src/components/SubscriptionPanel.jsx#L191-L219)). `poll` sau GET đơn kết thúc ([264–273](src/components/SubscriptionPanel.jsx#L264-L273)). `cancel` sau yêu cầu hủy và GET lại ([358–370](src/components/SubscriptionPanel.jsx#L358-L370)). [PaymentCallbackRoute.jsx:3–24](src/components/PaymentCallbackRoute.jsx#L3-L24) chỉ chuyển callback tới Dashboard. | Cùng ba trường giao dịch và URL chung như trên. | Có. [analytics.js:44–54](src/utils/analytics.js#L44-L54) chỉ chấp nhận `status === 'PAID'`. PENDING, CANCELLED, EXPIRED và status lấy từ URL không đủ để phát event. | Dedupe chung giữa ba nhánh cho cùng event/đơn trong phạm vi storage. Checkout trả PAID ngay hoặc restore đơn PAID chỉ gọi `finishOrder` ([158–170](src/components/SubscriptionPanel.jsx#L158-L170), [338–347](src/components/SubscriptionPanel.jsx#L338-L347)). Có thể thiếu event dù backend đã ghi nhận đơn thanh toán. |

### Kiểm kê Backend Admin Analytics

Tab Analytics gắn `AdminAnalytics` tại [AdminDashboardPage.jsx:21](src/pages/admin/AdminDashboardPage.jsx#L21). [adminApi.js:12–15](src/api/adminApi.js#L12-L15) gửi `GET /api/admin/analytics?days=30` mặc định, chấp nhận số nguyên 1–365. Giao diện có lựa chọn 7/30/90/365 và hiển thị `days`, `from`, `to` từ response. Kiểm tra dữ liệu tại [AdminDataViews.jsx:79–88](src/pages/admin/AdminDataViews.jsx#L79-L88) yêu cầu các tổng và số thuê bao hữu hạn, không âm, các nhóm bảng là mảng đối tượng và các mục doanh thu có `amount` hữu hạn. UI dùng số backend trả về và định dạng theo trường.

| Nhóm | Trường backend được sử dụng | Vị trí hiển thị |
|---|---|---|
| Tổng theo kỳ | `totals.trackedEvents`, `totals.visitors`, `totals.newUsers`, `totals.checkouts`, `totals.paidOrders`, `totals.revenue`. | [AdminDataViews.jsx:90](src/pages/admin/AdminDataViews.jsx#L90) |
| Phễu | `funnel[].step`, `label`, `unit`, `count`, `conversionFromPrevious`, `conversionFromStart`. UI gắn ký hiệu % cho số trả về, giữ giá trị trên 100%. | [AdminDataViews.jsx:77–91](src/pages/admin/AdminDataViews.jsx#L77-L91) |
| Kênh | `channels[].source`, `medium`, `visitors`, `checkouts`, `paidOrders`, `revenue`. | [AdminDataViews.jsx:92](src/pages/admin/AdminDataViews.jsx#L92) |
| Doanh thu | `revenue.weekly/monthly/yearly/period` với `amount`, `from`, `to`, `paidOrders`, `previousAmount`, `growthPercent`. Xu hướng dùng `trendGranularity` và `revenueTrend[].bucket/label/amount/paidOrders`. Tiền hiển thị VND, tăng trưởng null hiển thị N/A. | [AdminDataViews.jsx:93–94](src/pages/admin/AdminDataViews.jsx#L93-L94) |
| Thuê bao | `subscriptions.activeMonthly`, `activeYearly`, `totalActive`, `expiringIn30Days`, `payingUsers`. | [AdminDataViews.jsx:95](src/pages/admin/AdminDataViews.jsx#L95) |

**Mức xác minh.** Mã nguồn và tài liệu tích hợp xác nhận các trường được frontend sử dụng. Kiểm thử mock xác nhận hành vi của helper. Chủ dự án cung cấp phản hồi Swagger HTTP 200 ngày 29/10/2026 cho số tổng và số thuê bao tại mục 7.4. Định nghĩa khách truy cập, cách tính trackedEvents, phạm vi thời gian của số thuê bao và quy tắc UTM vẫn cần xác nhận với backend.

## Bản thảo đưa vào báo cáo

### 7. Chỉ số công cụ đo lường sản phẩm

#### 7.1. Mục đích đo lường

S-Club theo dõi lượt xem trang, lượt truy cập không gian CLB, thao tác xác thực và hành trình từ tạo đơn đến xác nhận thanh toán. Nhóm sử dụng số tổng hợp quản trị để đánh giá lượng truy cập, người dùng mới, chuyển đổi, kênh tiếp cận, doanh thu và thuê bao theo kỳ phù hợp.

#### 7.2. Công cụ sử dụng

- **Google Analytics 4 (GA4)** là công cụ được cấu hình để thu thập sáu tên sự kiện do frontend S-Club gọi. Việc GA4 thực sự nhận các sự kiện này chưa được xác minh. Báo cáo sự kiện dùng để kiểm tra lượt ghi nhận và tham số theo kỳ. DebugView hoặc Realtime dùng để xác minh hành vi cụ thể khi có quyền truy cập property.
- **Backend Admin Analytics** cung cấp chỉ số tổng hợp qua `GET /api/admin/analytics?days=30`. Trang quản trị hiển thị kỳ từ response và các nhóm tổng, phễu, kênh, doanh thu, thuê bao. Phạm vi và cách tính của từng chỉ số cần đối chiếu response hoặc tài liệu backend trước khi diễn giải.

#### 7.3. Bảng chỉ số đo lường sản phẩm S-Club

**G** = đã triển khai trong mã nguồn, helper đã kiểm thử mock, chưa xác minh trực tiếp trong GA4. **B** = frontend đã tích hợp trường backend, helper đã kiểm thử mock và tài liệu repo ghi nhận kiểm thử UI bằng fixture. **H** = có số liệu lịch sử từ phản hồi Swagger HTTP 200 do chủ dự án cung cấp. **Chưa xác minh** áp dụng cho số liệu GA4, các trường ngoài snapshot và số liệu hiện tại. Mã minh chứng dẫn tới hướng dẫn bên dưới.

| STT | Tên chỉ số trong báo cáo | Event Name trên GA4 hoặc chỉ số Backend | Vị trí kích hoạt trong Code | Các thuộc tính đo lường | Mục tiêu nghiệp vụ | Trạng thái xác minh | Minh chứng cần thu thập |
|---|---|---|---|---|---|---|---|
| 1 | Lượt xem trang | GA4 `page_view` | AnalyticsTracker.jsx:7, analytics.js:29 | Path, title, URL chung | Đo mức tiếp cận từng trang | G | G1 |
| 2 | Lượt đăng nhập thành công | GA4 `user_login` | LoginPage.jsx:45, RegisterPage.jsx:114 | Phương thức email/Google, URL chung | Theo dõi sử dụng các luồng xác thực | G | G2 |
| 3 | Lượt đăng ký email thành công | GA4 `user_register` | RegisterPage.jsx:80 | Phương thức email, URL chung | Đo hoàn tất đăng ký email | G | G3 |
| 4 | Lượt truy cập ngữ cảnh CLB | GA4 `view_club` | AnalyticsTracker.jsx:9, analytics.js:40 | ID CLB, tên CLB nếu có, URL chung | Theo dõi truy cập workspace | G | G4 |
| 5 | Lượt khởi tạo đơn thanh toán | GA4 `initiate_transaction` | SubscriptionPanel.jsx:345 | Mã đơn, giá trị, VND, URL chung | Theo dõi ý định mua qua tạo đơn | G | G5 |
| 6 | Lượt frontend ghi nhận đơn đã thanh toán | GA4 `complete_payment` | SubscriptionPanel.jsx:219, 272, 369 | Mã đơn, giá trị, VND, URL chung | Theo dõi xác nhận trả tiền qua các nhánh được gắn tracking | G | G6 |
| 7 | Số sự kiện theo tổng hợp quản trị | Backend `totals.trackedEvents` | adminApi.js:14, AdminDataViews.jsx:90 | Tổng và kỳ response | Theo dõi quy mô dữ liệu đo lường backend | B + H | B1 |
| 8 | Khách truy cập | Backend `totals.visitors` | adminApi.js:14, AdminDataViews.jsx:90 | Tổng Visitors và kỳ response | Đánh giá lượng tiếp cận theo backend | B + H | B1 |
| 9 | Người dùng mới | Backend `totals.newUsers` | adminApi.js:14, AdminDataViews.jsx:90 | Tổng New Users và kỳ response | Đánh giá tăng trưởng người dùng | B + H | B1 |
| 10 | Đơn khởi tạo | Backend `totals.checkouts` | adminApi.js:14, AdminDataViews.jsx:90 | Tổng Checkouts và kỳ response | Đo số checkout theo backend | B + H | B1 |
| 11 | Đơn đã thanh toán | Backend `totals.paidOrders` | adminApi.js:14, AdminDataViews.jsx:90 | Tổng Paid Orders và kỳ response | Đo đơn thanh toán theo backend | B + H | B1 |
| 12 | Doanh thu và xu hướng | Backend `totals.revenue`, `revenue`, `revenueTrend` | adminApi.js:14, AdminDataViews.jsx:90, 93–94 | VND, mốc thời gian, số đơn, kỳ trước, tăng trưởng, độ phân giải xu hướng | Đánh giá doanh thu theo kỳ | B + H cho tổng doanh thu. Chi tiết và xu hướng chưa xác minh. | B2 |
| 13 | Tỷ lệ chuyển đổi phễu | Backend `funnel[]` | adminApi.js:14, AdminDataViews.jsx:91 | Bước, đơn vị, số lượng, % từ bước trước và từ đầu | Xác định bước cần khảo sát thêm | B | B3 |
| 14 | Hiệu quả kênh tiếp cận | Backend `channels[]` | adminApi.js:14, AdminDataViews.jsx:92 | Source, medium, visitors, checkout, đơn trả tiền, VND | So sánh đóng góp của các kênh backend ghi nhận | B | B4 |
| 15 | Thuê bao | Backend `subscriptions` | adminApi.js:14, AdminDataViews.jsx:95 | Hoạt động theo tháng/năm, tổng hoạt động, sắp hết hạn 30 ngày, người dùng trả tiền | Theo dõi sử dụng gói và nhu cầu gia hạn | B + H | B5 |

#### 7.4. Kết quả đo lường thực tế

**Nguồn và kỳ đo lường.** Toàn bộ 11 giá trị dưới đây lấy từ phản hồi Swagger HTTP 200 cho `GET /api/admin/analytics?days=30` do chủ dự án cung cấp, chụp ngày **29/10/2026**. Kỳ truy vấn từ `2026-09-29T14:03:30.805180568` đến `2026-10-29T14:03:30.805180568`. Timestamp giữ nguyên theo phản hồi. Múi giờ và phạm vi thời gian áp dụng cho từng trường thuê bao chưa được xác nhận. Đây là số liệu lịch sử tại lần trích xuất.

| Chỉ số | Trường Backend Admin Analytics trong snapshot trên | Kết quả |
|---|---|---:|
| Sự kiện tổng hợp | `totals.trackedEvents` | 6 |
| Khách truy cập | `totals.visitors` | 4 |
| Người dùng mới | `totals.newUsers` | 4 |
| Checkout | `totals.checkouts` | 31 |
| Đơn đã thanh toán | `totals.paidOrders` | 9 |
| Tổng doanh thu | `totals.revenue` | 338.000 VND |
| Thuê bao tháng hoạt động | `subscriptions.activeMonthly` | 8 |
| Thuê bao năm hoạt động | `subscriptions.activeYearly` | 0 |
| Tổng thuê bao hoạt động | `subscriptions.totalActive` | 8 |
| Thuê bao sắp hết hạn trong 30 ngày | `subscriptions.expiringIn30Days` | 4 |
| Người dùng trả tiền | `subscriptions.payingUsers` | 3 |

| Kết quả còn thiếu | Kỳ hoặc thời điểm cần ghi | Nguồn cần đối chiếu | Kết quả |
|---|---|---|---|
| Số lượt ghi nhận riêng cho từng sự kiện GA4 | Ngày bắt đầu, ngày kết thúc, múi giờ property | GA4 Events hoặc Explorations | [CHƯA CÓ SỐ LIỆU XÁC MINH] |
| Ảnh GA4 và xác minh sự kiện, tham số | Thời điểm kiểm thử | GA4 Realtime và DebugView | [CHƯA CÓ SỐ LIỆU XÁC MINH] |
| Cấu hình property, web stream, Enhanced Measurement, key events và bộ lọc | Thời điểm chụp | GA4 Admin | [CHƯA CÓ SỐ LIỆU XÁC MINH] |
| Doanh thu chi tiết, tăng trưởng và xu hướng | Kỳ từng mục và bucket xu hướng | Backend `revenue`, `revenueTrend` | [CHƯA CÓ SỐ LIỆU XÁC MINH] |
| Số lượng và tỷ lệ chuyển đổi theo bước | `from`–`to` của phản hồi | Backend `funnel` | [CHƯA CÓ SỐ LIỆU XÁC MINH] |
| Hiệu quả theo source/medium | `from`–`to` của phản hồi | Backend `channels` | [CHƯA CÓ SỐ LIỆU XÁC MINH] |
| Số liệu backend hiện tại | Kỳ truy vấn mới và thời điểm trích xuất | Phản hồi Admin Analytics mới | [CHƯA CÓ SỐ LIỆU XÁC MINH] |

#### 7.5. Đánh giá và nhận xét

Mã nguồn và kiểm thử mock xác nhận cách frontend gọi sự kiện và đọc chỉ số quản trị. Snapshot Swagger do chủ dự án cung cấp hỗ trợ 11 giá trị backend trong kỳ lịch sử. Giá trị `trackedEvents = 6` là trường backend trả về và chưa có định nghĩa tính toán. Sự trùng hợp về số lượng không xác minh sáu tên sự kiện GA4. Phương pháp đếm khách truy cập và phạm vi thời gian của các số thuê bao vẫn cần xác nhận với backend.

Lượt sự kiện GA4 có đơn vị khác với lượng người dùng hoặc đơn hàng duy nhất. Hai luồng Google hiện được ghi nhận là đăng nhập. Lượt truy cập CLB dựa vào ngữ cảnh lưu trên trình duyệt. Lượt hoàn tất thanh toán GA4 phụ thuộc vào việc frontend đi qua một trong ba nhánh xác minh được gắn tracking. Khi so sánh các nguồn, cần đối chiếu đơn vị, phạm vi thời gian và phương pháp tính của từng chỉ số.

## Thu thập minh chứng

Chọn đúng property và web stream S-Club bằng tài khoản đã có quyền. Dùng Tag Assistant để bật debug cho thiết bị kiểm thử, sau đó mở **Admin → Data display → DebugView**. Bấm event để mở tham số. Có thể đối chiếu **Reports → Realtime → Event count by Event name**. Để chốt số theo kỳ, dùng **Reports → Engagement → Events** nếu collection hiển thị mục này, hoặc Explorations với Event name/Event count và kỳ báo cáo. Chụp màn hình có tên event, timestamp/kỳ và nguồn. Ghi rõ môi trường staging hay production và múi giờ. Tách traffic kiểm thử khỏi số sản phẩm. [Hướng dẫn DebugView](https://support.google.com/analytics/answer/7201382) · [Hướng dẫn Realtime và tham số](https://support.google.com/analytics/answer/9322688?hl=en).

| Mã | Thao tác và ảnh cần chụp |
|---|---|
| G1 | Mở Home rồi bấm Features. Trong DebugView chọn `page_view` của hai trang, kiểm tra `page_path`, `page_title`, `page_location`, `page_referrer`. Chụp timeline và tham số, kiểm tra cả khả năng trùng browser-history. |
| G2 | Đăng nhập bằng tài khoản kiểm thử có sẵn. Kiểm tra email và Google từ Login. Kiểm tra Google từ Register bằng tài khoản đã có trong môi trường test. Chụp `user_login`, `method` và pathname nguồn tương ứng. |
| G3 | Đăng ký email trên staging có quyền tạo dữ liệu test. Chụp `user_register`, `method=email` và URL chung. Với production, dùng event lịch sử đã có. |
| G4 | Mở CLB có sẵn mà tài khoản được phép truy cập, điều hướng giữa hai trang trong CLB, rồi đổi CLB hoặc rời/vào lại. Chụp `view_club` và tham số `club_id`, `club_name` nếu có, URL chung. Che giá trị định danh. Kiểm tra riêng việc vào `/features` khi còn ngữ cảnh CLB để xác nhận sai lệch đã nêu. |
| G5 | Chọn gói và tạo checkout bằng vai trò được phép trong sandbox/staging. Chụp `initiate_transaction`, `transaction_id` đã che, `value`, `currency` và URL chung. Nếu thiếu sandbox, dùng dữ liệu lịch sử. |
| G6 | Dùng đơn sandbox được xác nhận PAID, kiểm tra qua callback hoặc polling và đối chiếu trạng thái server. Kiểm tra các trường hợp PENDING/CANCELLED/EXPIRED và lặp lại callback bằng fixture ở môi trường test. Chụp `complete_payment` cùng mã đơn đã che, `value`, `currency`, URL chung. Với production, dùng event và đơn lịch sử đã có. |
| B1 | Admin đã được cấp quyền mở Analytics, chọn 30 days. Chụp tiêu đề kỳ và các thẻ tổng, đối chiếu `days/from/to/totals` trong response của chính trang. Dùng ảnh này cho từng hàng 7–11. |
| B2 | Trong cùng kỳ, chụp Revenue Overview và Revenue Trend. Giữ mốc thời gian từng mục, đơn vị VND, số đơn, tăng trưởng và granularity. Đối chiếu `totals.revenue`, `revenue`, `revenueTrend`. |
| B3 | Chụp Conversion Funnel và kỳ lọc. Đối chiếu từng bước với `step/unit/count/conversionFromPrevious/conversionFromStart`, xin định nghĩa mẫu số và đơn vị từ backend nếu cần diễn giải. |
| B4 | Chụp UTM Channels và kỳ lọc. Kiểm tra `source/medium` cùng lượt truy cập, checkout, đơn trả tiền, doanh thu. Nếu thu thập thêm nguồn GA4, chụp riêng Traffic acquisition cùng kỳ và ghi rõ dimension đang dùng. [Hướng dẫn Traffic acquisition](https://support.google.com/analytics/answer/12923437?hl=en) |
| B5 | Chụp Subscriptions, giữ thời điểm trích xuất và kỳ hiển thị. Đối chiếu năm trường của `subscriptions` và xác nhận với backend các trường nào là ảnh chụp tại thời điểm truy vấn. |

Ưu tiên ảnh và dữ liệu lịch sử khi thu minh chứng production. Các bước tái hiện ở trên dành cho môi trường kiểm thử hoặc thao tác điều hướng và đăng nhập với tài khoản đã có. Dùng bản ghi có sẵn, sandbox hoặc mock cho các luồng phát sinh tài khoản, checkout và thanh toán. Che token, email, ID tài khoản, ID/tên CLB, mã đơn, ID property nếu ảnh cần công bố và mọi dữ liệu nhạy cảm. Không đính kèm raw network headers, cookie hoặc URL chứa thông tin nhạy cảm. Mock chỉ dùng làm minh chứng kỹ thuật.

### Checklist ảnh GA4 còn cần

- [ ] **Events hoặc Explorations:** ảnh kỳ báo cáo, bộ lọc website S-Club và Event count cho đủ sáu tên ở hàng 1–6. Ghi kèm múi giờ property.
- [ ] **Realtime → Event count by Event name:** ảnh các tên sự kiện trong cửa sổ kiểm thử theo G1–G6.
- [ ] **DebugView:** ảnh từng tên sự kiện cùng tham số theo G1–G6, gồm cả hai phương thức của `user_login`. Dùng môi trường kiểm thử hoặc minh chứng lịch sử sẵn có cho đăng ký, checkout và thanh toán. Che định danh và mã đơn.
- [ ] **GA4 Admin:** ảnh múi giờ property, web stream S-Club, trạng thái Enhanced Measurement và Page views/browser history, danh sách key events và bộ lọc traffic kiểm thử.

## Minh chứng còn thiếu và khoảng trống tracking

- Chưa có ảnh, số đếm hoặc export GA4 S-Club. Realtime/DebugView và cấu hình property chưa được xác minh. Snapshot chỉ hỗ trợ các trường đã điền tại 7.4. Phễu, kênh, doanh thu chi tiết và số liệu hiện tại vẫn thiếu minh chứng.
- **Chưa triển khai, chỉ đề xuất nếu báo cáo cần các phép đo này:** sự kiện riêng cho tạo/gia nhập CLB, hoàn tất xác thực Google lần đầu, thao tác Google Workspace, thao tác Trello/task, tạo sự kiện lịch, giao dịch tài chính/quỹ, chat, thông báo, hủy hoặc hết hạn thanh toán. Kiểm tra lại source khi bổ sung instrumentation. Hiện không có tên event hay payload đã xác minh để chụp DebugView cho các phép đo đó. [CreateClubPage.jsx:40–65](src/pages/CreateClubPage.jsx#L40-L65) · [SelectClubPage.jsx:172–187](src/pages/SelectClubPage.jsx#L172-L187).
- Không tìm thấy lời gọi GA4 `purchase`, `begin_checkout`, `sign_up` hay `login` trong mã ứng dụng. GA4 tự động hoặc cấu hình ngoài repo cần minh chứng riêng. Các event của ứng dụng vault không thuộc bảng S-Club.
- Trước khi dùng `view_club` hoặc `complete_payment` làm mẫu số báo cáo, xác minh sai lệch route công khai và các nhánh đơn PAID bỏ qua tracking. So sánh số thanh toán với backend theo cùng kỳ. Phạm vi dedup hiện tại không bảo đảm số đơn duy nhất giữa các tab hoặc các phiên trình duyệt.
- Đợt kiểm toán này chỉ đọc mã nguồn, chạy mock trong bộ nhớ và tạo tài liệu này. Không có truy vấn private production, giao dịch thật, bản ghi production hay số liệu giả dùng làm kết quả.
