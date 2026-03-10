<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <el-card class="filter-container search-header" shadow="never">
      <el-form :inline="true" :model="listQuery" class="demo-form-inline">
        <el-row :gutter="10">
          <el-col :span="6">
            <el-form-item label="家庭编号：" style="width: 100%;">
              <el-select
                v-model="listQuery.invoice_no"
                placeholder="请选择或输入家庭编号"
                clearable
                filterable
                remote
                :remote-method="handleFamilySearch"
                :loading="familyLoading"
                style="width: 100%;"
                @change="handleSearch"
              >
                <el-option
                  v-for="(item, index) in familyOptions"
                  :key="item + '-' + index"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="学生搜索：" style="width: 100%;">
              <el-input v-model="listQuery.search" placeholder="姓名/英文名/学号" clearable style="width: 100%;" @keyup.enter.native="handleSearch" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="支付方式：" style="width: 100%;">
              <el-select v-model="listQuery.payment_type" placeholder="全部" clearable style="width: 100%;" @change="handleSearch">
                <el-option label="全年支付" value="yearly" />
                <el-option label="第一学期" value="semester_1" />
                <el-option label="第二学期" value="semester_2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="10">
          <el-col :span="6">
            <el-form-item label="教师子弟：" style="width: 100%;">
              <el-select v-model="listQuery.is_teacher_child" placeholder="全部" clearable style="width: 100%;" @change="handleSearch">
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="学年：" style="width: 100%;">
              <el-select v-model="listQuery.academic_year" placeholder="全部" clearable style="width: 100%;" @change="handleSearch">
                <el-option v-for="year in academicYearOptions" :key="year" :label="year" :value="year" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="10">
          <el-col :span="6">
            <el-form-item label="邮件状态：" style="width: 100%;">
              <el-select v-model="listQuery.email_sent" placeholder="全部" clearable style="width: 100%;" @change="handleSearch">
                <el-option label="已发送" :value="true" />
                <el-option label="未发送" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
              <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <el-card class="operate-container" shadow="never" style="margin-top: 15px;">
      <div class="table-operation">
        <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增学费信息</el-button>
        <el-button type="success" icon="el-icon-upload2" @click="handleImport">批量导入</el-button>
        <el-button type="success" icon="el-icon-message" @click="handleBatchEmail">批量发送邮件</el-button>
        <el-button icon="el-icon-refresh" @click="refreshCache">刷新缓存</el-button>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-container" shadow="never" style="margin-top: 15px;">
      <el-table
        v-loading="listLoading"
        :data="list"
        element-loading-text="加载中..."
        border
        fit
        highlight-current-row
        style="width: 100%;"
        :max-height="tableHeight"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="学生" align="center" min-width="180">
          <template slot-scope="scope">
            <div style="font-weight: bold;">{{ scope.row.student_name }}</div>
            <div style="color: #909399; font-size: 12px;">{{ scope.row.student_english_name }}</div>
            <div style="color: #c0c4cc; font-size: 12px;">学号: {{ scope.row.student_no }}</div>
          </template>
        </el-table-column>
        <el-table-column label="班级" prop="student_class_name" align="center" min-width="100" />
        <el-table-column label="家庭编号" prop="invoice_no" align="center" min-width="120" />
        <el-table-column label="学年" prop="academic_year" align="center" width="100" />
        <el-table-column label="学费期间" prop="tuition_period" align="center" min-width="180" />
        <el-table-column label="学费期间天数" prop="tuition_period_days" align="center" width="100">
          <template slot-scope="scope">
            <span v-if="scope.row.tuition_period_days">{{ scope.row.tuition_period_days }}天</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" align="center" width="120">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.payment_type === 'yearly'" type="primary" size="small">全年支付</el-tag>
            <el-tag v-else-if="scope.row.payment_type === 'semester_1'" type="warning" size="small">第一学期</el-tag>
            <el-tag v-else-if="scope.row.payment_type === 'semester_2'" type="warning" size="small">第二学期</el-tag>
            <el-tag v-else type="info" size="small">{{ scope.row.payment_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="折扣类型" align="center" min-width="220">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.is_teacher_child" type="danger" size="small" class="discount-tag">教师子弟</el-tag>
            <el-tag v-if="scope.row.discount_sibling > 0" type="primary" size="small" class="discount-tag">兄弟姐妹</el-tag>
            <el-tag v-if="scope.row.discount_company > 0" type="warning" size="small" class="discount-tag">公司折扣</el-tag>
            <el-tag v-if="scope.row.discount_alumni > 0" type="success" size="small" class="discount-tag">校友</el-tag>
            <el-tag v-if="scope.row.scholarship_amount > 0" type="info" size="small" class="discount-tag">奖学金 ¥{{ scope.row.scholarship_amount }}</el-tag>
            <span v-if="!scope.row.is_teacher_child && !(scope.row.discount_sibling > 0) && !(scope.row.discount_company > 0) && !(scope.row.discount_alumni > 0) && !(scope.row.scholarship_amount > 0)">-</span>
          </template>
        </el-table-column>

        <el-table-column label="邮件状态" align="center" width="120">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.email_sent" type="success" size="small">已发送</el-tag>
            <el-tag v-else type="info" size="small">未发送</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="text" size="small" @click="handleViewDetail(scope.row)">查看详情</el-button>
            <el-button type="text" size="small" style="color: #f56c6c;" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态提示 -->
      <div v-if="!listLoading && list.length === 0" style="text-align: center; padding: 40px 0;">
        <i class="el-icon-warning-outline" style="font-size: 48px; color: #909399;" />
        <p style="color: #909399; margin-top: 10px;">暂无学费信息数据</p>
        <p style="color: #c0c4cc; font-size: 12px;">请先在"新增学费信息"按钮中添加数据</p>
      </div>

      <!-- 分页 -->
      <div v-if="total > 0" class="pagination-container" style="margin-top: 20px; text-align: right;">
        <el-pagination
          background
          :current-page="listQuery.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="listQuery.page_size"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 编辑/新增对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="700px">
      <el-form ref="tuitionForm" :model="tuitionForm" :rules="rules" label-width="130px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学生" prop="student">
              <el-select v-model="tuitionForm.student" placeholder="请选择学生" filterable style="width: 100%;" :disabled="isEdit">
                <el-option
                  v-for="item in studentOptions"
                  :key="item.id"
                  :label="`${item.last_name} ${item.first_name} (${item.english_name})`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="家庭编号" prop="invoice_no">
              <el-input v-model="tuitionForm.invoice_no" placeholder="请输入家庭编号，如 F0001" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学年" prop="academic_year">
              <el-select v-model="tuitionForm.academic_year" placeholder="请选择学年" style="width: 100%;">
                <el-option v-for="year in academicYearOptions" :key="year" :label="year" :value="year" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="支付方式" prop="payment_type">
              <el-radio-group v-model="paymentTypeGroup" @change="handlePaymentTypeChange">
                <el-radio label="yearly">全年支付</el-radio>
                <el-radio label="semester">学期支付</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="paymentTypeGroup === 'semester'" :gutter="20">
          <el-col :span="24">
            <el-form-item label="选择学期" prop="semester">
              <el-select v-model="tuitionForm.semester" placeholder="请选择学期" style="width: 100%;" filterable @change="handleSemesterChange">
                <el-option
                  v-for="item in semesterOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学费期间">
              <el-input v-model="tuitionForm.tuition_period" placeholder="自动计算，如：2025.08.18-2026.06.19" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学费期间天数">
              <el-input-number v-model="tuitionForm.tuition_period_days" :min="0" :precision="0" style="width: 100%;" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期">
              <el-date-picker
                v-model="tuitionForm.start_date"
                type="date"
                placeholder="选择开始日期"
                value-format="yyyy-MM-dd"
                style="width: 100%;"
                @change="handleDateChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期">
              <el-date-picker
                v-model="tuitionForm.end_date"
                type="date"
                placeholder="选择结束日期"
                value-format="yyyy-MM-dd"
                style="width: 100%;"
                @change="handleDateChange"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="注册费（新生）">
              <el-input-number v-model="tuitionForm.registration_fee" :min="0" :precision="2" style="width: 100%;" />
              <span class="form-tip">注册费不为空则表示新生</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">折扣信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="教师子弟">
              <el-switch v-model="tuitionForm.is_teacher_child" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="校友折扣">
              <el-input-number v-model="tuitionForm.discount_alumni" :min="0" :precision="2" :controls="true" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="公司折扣">
              <el-input-number v-model="tuitionForm.discount_company" :min="0" :precision="2" :controls="true" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="奖学金金额">
              <el-input-number v-model="tuitionForm.scholarship_amount" :min="0" :precision="2" :controls="true" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学弟姐妹折扣">
              <el-input-number v-model="tuitionForm.discount_sibling" :min="0" :precision="2" :controls="true" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog title="批量导入学费信息" :visible.sync="importDialogVisible" width="500px">
      <el-form ref="importForm" :model="importForm" label-width="80px">
        <el-form-item label="学年" prop="academic_year" :rules="[{ required: true, message: '请选择或输入学年', trigger: 'change' }]">
          <el-select v-model="importForm.academic_year" placeholder="请选择或输入学年" style="width: 100%;" filterable allow-create default-first-option>
            <el-option v-for="year in academicYearOptions" :key="year" :label="year" :value="year" />
          </el-select>
        </el-form-item>
      </el-form>
      <el-upload
        ref="upload"
        class="upload-demo"
        drag
        :action="uploadAction"
        :data="importForm"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :before-upload="beforeUpload"
        accept=".xlsx,.xls"
        :auto-upload="true"
      >
        <i class="el-icon-upload" />
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div slot="tip" class="el-upload__tip">
          只能上传 Excel 文件(.xlsx, .xls)，且不超过 10MB
        </div>
      </el-upload>
      <div slot="footer" class="dialog-footer">
        <el-button @click="importDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleDownloadTemplate">下载导入模板</el-button>
      </div>
    </el-dialog>

    <!-- 学费详情对话框 -->
    <el-dialog title="学费详情" :visible.sync="detailDialogVisible" width="700px">
      <div v-if="detailData">
        <!-- 学期选择 -->
        <el-form v-if="detailData.payment_type === 'semester_1' || detailData.payment_type === 'semester_2'" :inline="true" class="detail-semester-form" style="margin-bottom: 20px;">
          <el-form-item label="选择学期：">
            <el-select v-model="detailSemesterId" placeholder="请选择学期" style="width: 320px;" @change="handleDetailSemesterChange">
              <el-option
                v-for="item in semesterOptions"
                :key="item.id"
                :label="item.name + ' (' + item.total_working_days + '个工作日)' + (item.is_current ? ' [当前学期]' : '')"
                :value="item.id"
              />
            </el-select>
            <span v-if="detailSemesterId && currentSemesterConfig && detailSemesterId === currentSemesterConfig.id" style="margin-left: 10px; color: #67c23a; font-size: 12px;">
              当前学期
            </span>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="recalculateDetail">重新计算</el-button>
          </el-form-item>
        </el-form>
        
        <!-- 学生基本信息 -->
        <el-descriptions :column="2" border title="学生信息">
          <el-descriptions-item label="学生">{{ detailData.student_name }}</el-descriptions-item>
          <el-descriptions-item label="家庭编号">{{ detailData.invoice_no }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ detailData.grade }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">
            <el-tag v-if="detailData.payment_type === 'yearly'" type="success">全年支付</el-tag>
            <el-tag v-else-if="detailData.payment_type === 'semester_1'" type="warning">第一学期</el-tag>
            <el-tag v-else-if="detailData.payment_type === 'semester_2'" type="warning">第二学期</el-tag>
            <el-tag v-else type="info">{{ detailData.payment_type }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 学期信息（仅学期支付显示） -->
        <el-descriptions v-if="detailData.payment_type === 'semester_1' || detailData.payment_type === 'semester_2'" :column="2" border title="学期信息" style="margin-top: 15px;">
          <el-descriptions-item label="学期">{{ detailData.semester_name || '当前学期' }}</el-descriptions-item>
          <el-descriptions-item label="学期费率">{{ detailData.semester_rate > 0 ? detailData.semester_rate + '%' : '按天数计算' }}</el-descriptions-item>
          <el-descriptions-item label="学期总工作日">{{ detailData.semester_days }}天</el-descriptions-item>
          <el-descriptions-item v-if="detailData.tuition_period_days" label="学费期间天数">{{ detailData.tuition_period_days }}天</el-descriptions-item>
          <el-descriptions-item v-else label="入学后工作日">{{ detailData.student_working_days }}天</el-descriptions-item>
        </el-descriptions>
        
        <!-- 费用明细 -->
        <el-descriptions :column="2" border title="费用明细" style="margin-top: 15px;">
          <el-descriptions-item label="基础学费">
            <span>¥{{ detailData.base_tuition }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="注册费">
            <span>¥{{ detailData.registration_fee }}</span>
          </el-descriptions-item>
          <el-descriptions-item v-if="detailData.payment_type === 'semester_1' || detailData.payment_type === 'semester_2'" label="学期学费">
            <span>¥{{ detailData.semester_tuition_before_discount }}</span>
          </el-descriptions-item>
          <el-descriptions-item v-else label="学费小计">
            <span>¥{{ detailData.base_tuition }}</span>
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 折扣明细 -->
        <el-descriptions :column="2" border title="折扣明细" style="margin-top: 15px;">
          <el-descriptions-item label="兄弟姐妹折扣">
            <span v-if="detailData.sibling_discount_amount > 0" class="discount-text">
              -¥{{ detailData.sibling_discount_amount }} ({{ detailData.sibling_discount_rate }}%)
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="教师折扣">
            <span v-if="detailData.teacher_discount_amount > 0" class="discount-text">
              -¥{{ detailData.teacher_discount_amount }} ({{ detailData.teacher_discount_rate }}%)
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="校友兄弟姐妹折扣">
            <span v-if="detailData.alumni_discount_amount > 0" class="discount-text">
              -¥{{ detailData.alumni_discount_amount }} ({{ detailData.alumni_discount_rate }}%)
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="公司折扣">
            <span v-if="detailData.company_discount_amount > 0" class="discount-text">
              -¥{{ detailData.company_discount_amount }} ({{ detailData.company_discount_rate }}%)
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="奖学金">
            <span v-if="detailData.scholarship_amount > 0" class="discount-text">
              -¥{{ detailData.scholarship_amount }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="折扣后学费">
            <span v-if="detailData.payment_type === 'semester_1' || detailData.payment_type === 'semester_2'">¥{{ (detailData.semester_tuition_before_discount - detailData.sibling_discount_amount - detailData.teacher_discount_amount - detailData.alumni_discount_amount - detailData.scholarship_amount - detailData.company_discount_amount).toFixed(2) }}</span>
            <span v-else>¥{{ (detailData.base_tuition - detailData.sibling_discount_amount - detailData.teacher_discount_amount - detailData.alumni_discount_amount - detailData.scholarship_amount - detailData.company_discount_amount).toFixed(2) }}</span>
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 最终费用 -->
        <el-descriptions :column="1" border title="最终费用" style="margin-top: 15px;">
          <el-descriptions-item label="最终学费">
            <span class="amount-text" style="font-size: 20px; font-weight: bold;">¥{{ detailData.final_tuition }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'StudentTuition',
  data() {
    return {
      list: [],
      total: 0,
      listLoading: false,
      tableHeight: 531,
      studentOptions: [],
      semesterOptions: [],
      currentSemesterConfig: null,  // 当前启用的学期配置
      paymentTypeGroup: 'yearly',  // 用于界面显示的支付方式分组（yearly/semester）
      familyOptions: [],
      familyLoading: false,
      allFamilyOptions: [],
      selectedRows: [],
      academicYearOptions: ['2025-2026', '2024-2025', '2023-2024'],
      // 支付方式配置常量
      PAYMENT_TYPE_CONFIG: {
        YEARLY: { value: 'yearly', label: '全年支付', group: 'yearly' },
        SEMESTER_1: { value: 'semester_1', label: '第一学期', group: 'semester', semesterNum: 1 },
        SEMESTER_2: { value: 'semester_2', label: '第二学期', group: 'semester', semesterNum: 2 }
      },
      listQuery: {
        page: 1,
        page_size: 20,
        invoice_no: '',
        search: '',
        payment_type: '',
        academic_year: '',
        is_teacher_child: '',
        email_sent: ''
      },
      dialogVisible: false,
      detailDialogVisible: false,
      importDialogVisible: false,
      dialogTitle: '',
      isEdit: false,
      uploadAction: '/sljt/tuition/excel/',
      importForm: {
        academic_year: '2025-2026'
      },
      tuitionForm: {
        id: null,
        student: null,
        invoice_no: '',
        academic_year: '2025-2026',
        is_teacher_child: false,
        payment_type: 'yearly',
        tuition_period: '',
        tuition_period_days: null,
        start_date: null,
        end_date: null,
        semester: null,
        registration_fee: null,
        discount_company: 0,
        discount_alumni: 0,
        discount_sibling: 0,
        scholarship_amount: 0
      },
      detailData: null,
      detailSemesterId: null,
      detailStudentId: null,
      editOriginData: null,  // 编辑时保存原始数据，用于对比变化
      rules: {
        student: [{ required: true, message: '请选择学生', trigger: 'change' }],
        invoice_no: [{ required: true, message: '请输入家庭编号', trigger: 'blur' }],
        payment_type: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
        semester: [{ 
          required: true, 
          message: '请选择学期', 
          trigger: 'change',
          validator: (rule, value, callback) => {
            if (this.paymentTypeGroup === 'semester' && !value) {
              callback(new Error('学期支付时必须选择学期'))
            } else {
              callback()
            }
          }
        }]
      }
    }
  },
  created() {
    // 加载列表数据和学生选项（并行）
    this.initPageData()
  },
  mounted() {
    this.getTableHeight()
    window.addEventListener('resize', () => {
      this.getTableHeight()
    })
  },
  methods: {
    // 初始化页面数据（并行加载）
    async initPageData() {
      console.log('开始加载页面数据...')
      const startTime = Date.now()
      
      // 并行加载列表数据和筛选选项
      await Promise.all([
        this.getList(),
        this.getFamilyOptions(),
        this.getSemesterOptions()
      ])
      
      // 从已加载的数据中提取学年列表
      this.extractAcademicYears()
      
      // 学生选项需要等列表加载完成后再加载（用于新增时过滤）
      this.getStudentOptions()
      
      const endTime = Date.now()
      console.log(`页面数据加载完成，耗时: ${endTime - startTime}ms`)
    },
    
    // 刷新数据
    async refreshCache() {
      this.$message.info('正在刷新数据...')
      // 重置分页到第一页
      this.listQuery.page = 1
      await this.initPageData()
      this.$message.success('数据已刷新')
    },
    
    // 从列表数据中提取学年列表（去重并排序）
    extractAcademicYears() {
      const years = new Set()
      this.list.forEach(item => {
        if (item.academic_year) {
          years.add(item.academic_year)
        }
      })
      // 转为数组并按降序排序
      this.academicYearOptions = Array.from(years).sort().reverse()
      console.log('提取的学年列表:', this.academicYearOptions)
    },
    
    // 计算表格最大高度，避免双滚动条
    getTableHeight() {
      this.$nextTick(() => {
        const innerHeight = window.innerHeight
        const header = document.getElementsByClassName('search-header')[0]
        const operate = document.getElementsByClassName('operate-container')[0]
        const headerHeight = header ? header.clientHeight : 0
        const operateHeight = operate ? operate.clientHeight : 0
        // 50: 顶部导航, 60: card padding, 30: 底部间距, 32: 分页高度, 64: 其他间距
        this.tableHeight = innerHeight - 50 - headerHeight - operateHeight - 60 - 30 - 32 - 64
      })
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleString('zh-CN')
    },
    
    // 构建查询参数
    buildQueryParams() {
      const params = {
        page: this.listQuery.page,
        page_size: this.listQuery.page_size
      }
      
      // 添加筛选条件
      if (this.listQuery.invoice_no) {
        params.invoice_no = this.listQuery.invoice_no
      }
      if (this.listQuery.search) {
        params.search = this.listQuery.search
      }
      if (this.listQuery.payment_type) {
        params.payment_type = this.listQuery.payment_type
      }
      if (this.listQuery.academic_year) {
        params.academic_year = this.listQuery.academic_year
      }
      if (this.listQuery.is_teacher_child !== '') {
        params.is_teacher_child = this.listQuery.is_teacher_child
      }
      if (this.listQuery.email_sent !== '') {
        params.email_sent = this.listQuery.email_sent
      }
      
      return params
    },
    
    // 获取所有学生数据（处理分页）
    async getAllStudents() {
      const allStudents = []
      let page = 1
      const pageSize = 100
      let hasMore = true
      
      try {
        while (hasMore) {
          const res = await this.$http.get('/students/', { 
            params: { page: page, page_size: pageSize } 
          })
          
          let dataList = []
          if (Array.isArray(res)) {
            dataList = res
            hasMore = false
          } else if (res.results && Array.isArray(res.results)) {
            dataList = res.results
            hasMore = dataList.length === pageSize && (res.count > allStudents.length + dataList.length)
          } else if (res.data && Array.isArray(res.data)) {
            dataList = res.data
            hasMore = false
          }
          
          allStudents.push(...dataList)
          
          if (dataList.length < pageSize) {
            hasMore = false
          }
          page++
          
          // 安全限制，最多获取10000条
          if (allStudents.length > 10000) {
            break
          }
        }
      } catch (error) {
        console.error('获取学生列表失败:', error)
      }
      
      return allStudents
    },
    
    // 获取列表数据（支持分页）
    async getList() {
      this.listLoading = true
      try {
        const params = this.buildQueryParams()
        const res = await this.$http.get('/studenttuitioninfo/', { params })
        console.log('学生学费信息返回数据:', res)
        
        // 处理不同可能的返回格式
        let dataList = []
        let totalCount = 0
        
        if (Array.isArray(res)) {
          dataList = res
          totalCount = res.length
        } else if (res.results && Array.isArray(res.results)) {
          dataList = res.results
          totalCount = res.count || res.results.length
        } else if (res.data && Array.isArray(res.data)) {
          dataList = res.data
          totalCount = res.total || res.data.length
        } else if (typeof res === 'object' && res !== null) {
          if (res.id) {
            dataList = [res]
            totalCount = 1
          }
        }
        
        this.list = dataList.map(item => ({
          ...item,
          is_teacher_child: !!item.is_teacher_child,
          email_sent: !!item.email_sent,
          scholarship_amount: parseFloat(item.scholarship_amount) || 0,
          discount_company: parseFloat(item.discount_company) || 0,
          discount_alumni: parseFloat(item.discount_alumni) || 0,
          discount_sibling: parseFloat(item.discount_sibling) || 0
        }))
        
        // 使用后端返回的总数
        this.total = totalCount
        
        if (dataList.length === 0 && this.listQuery.page === 1) {
          this.$message.info('暂无学费信息数据')
        }
      } catch (error) {
        console.error('获取学费信息失败:', error)
        this.$message.error('获取学费信息失败: ' + (error.message || '网络错误'))
        this.list = []
        this.total = 0
      } finally {
        this.listLoading = false
      }
    },
    
    // 获取所有学费信息（用于过滤已有学费的学生）
    async getAllTuitionInfo() {
      const allTuition = []
      let page = 1
      const pageSize = 100
      let hasMore = true
      
      try {
        while (hasMore) {
          const res = await this.$http.get('/studenttuitioninfo/', { 
            params: { page: page, page_size: pageSize } 
          })
          
          let dataList = []
          if (Array.isArray(res)) {
            dataList = res
            hasMore = false
          } else if (res.results && Array.isArray(res.results)) {
            dataList = res.results
            hasMore = dataList.length === pageSize && (res.count > allTuition.length + dataList.length)
          } else if (res.data && Array.isArray(res.data)) {
            dataList = res.data
            hasMore = false
          }
          
          allTuition.push(...dataList)
          
          if (dataList.length < pageSize) {
            hasMore = false
          }
          page++
          
          // 安全限制
          if (allTuition.length > 10000) {
            break
          }
        }
      } catch (error) {
        console.error('获取学费信息失败:', error)
      }
      
      return allTuition
    },
    
    // 获取所有学生（处理分页）
    async getAllStudents() {
      const allStudents = []
      let page = 1
      const pageSize = 100
      let hasMore = true
      
      try {
        while (hasMore) {
          const res = await this.$http.get('/students/', { 
            params: { page: page, page_size: pageSize } 
          })
          
          let dataList = []
          if (Array.isArray(res)) {
            dataList = res
            hasMore = false
          } else if (res.results && Array.isArray(res.results)) {
            dataList = res.results
            hasMore = dataList.length === pageSize && (res.count > allStudents.length + dataList.length)
          } else if (res.data && Array.isArray(res.data)) {
            dataList = res.data
            hasMore = false
          }
          
          allStudents.push(...dataList)
          
          if (dataList.length < pageSize) {
            hasMore = false
          }
          page++
          
          // 安全限制
          if (allStudents.length > 10000) {
            break
          }
        }
      } catch (error) {
        console.error('获取学生列表失败:', error)
      }
      
      return allStudents
    },
    
    // 获取学生选项（只显示没有学费信息的学生）
    async getStudentOptions() {
      try {
        // 并行获取学生列表和学费信息列表
        const [studentsRes, tuitionRes] = await Promise.all([
          this.getAllStudents(),
          this.getAllTuitionInfo()
        ])
        
        console.log('所有学生数量:', studentsRes.length)
        console.log('已有学费信息的学生数量:', tuitionRes.length)
        console.log('学生名单:', studentsRes.map(s => ({ id: s.id, name: s.english_name || s.last_name + s.first_name })))
        console.log('已有学费的学生ID:', tuitionRes.map(t => t.student))
        
        // 获取已有学费信息的学生ID集合
        const studentsWithTuition = new Set(tuitionRes.map(item => item.student))
        
        // 过滤掉已有学费信息的学生
        const filteredStudents = studentsRes.filter(student => !studentsWithTuition.has(student.id))
        
        console.log('过滤后可选择的学生:', filteredStudents.map(s => ({ id: s.id, name: s.english_name || s.last_name + s.first_name })))
        
        this.studentOptions = filteredStudents
        
        if (filteredStudents.length === 0 && studentsRes.length > 0) {
          this.$message.info('所有学生都已有学费信息')
        }
      } catch (error) {
        console.error('获取学生列表失败:', error)
        this.studentOptions = []
      }
    },
    
    // 获取学期选项
    async getSemesterOptions() {
      try {
        // 获取所有学期配置，不过滤 is_active
        const res = await this.$http.get('/semesterconfig/', { params: { ordering: '-academic_year,semester_number' }})
        let results = []
        if (Array.isArray(res)) {
          results = res
        } else if (res.results) {
          results = res.results
        } else if (res.data) {
          results = Array.isArray(res.data) ? res.data : [res.data]
        }
        console.log('学期选项数据:', results)
        this.semesterOptions = results
        
        // 找出当前学期配置（is_current=true）
        const currentConfig = results.find(item => item.is_current)
        if (currentConfig) {
          this.currentSemesterConfig = currentConfig
          console.log('当前学期配置:', currentConfig.name)
        } else if (results.length > 0) {
          // 如果没有标记为当前学期的，使用第一个启用的
          const activeConfig = results.find(item => item.is_active)
          if (activeConfig) {
            this.currentSemesterConfig = activeConfig
          }
        }
      } catch (error) {
        console.error('获取学期列表失败:', error)
        this.semesterOptions = []
      }
    },
    
    // 获取家庭编号选项
    async getFamilyOptions() {
      try {
        const res = await this.$http.get('/tuition/calculate/', { params: { type: 'families' }})
        console.log('家庭编号接口返回:', res)
        let dataList = []
        if (Array.isArray(res)) {
          dataList = res
        } else if (res.code === 1 && res.data && res.data.families) {
          // 处理 {code: 1, data: {families: [...]}} 格式
          const families = res.data.families
          if (Array.isArray(families)) {
            dataList = families
          } else if (typeof families === 'object') {
            // 可能是 {all_yearly: [...], all_semester: [...], mixed: [...]} 格式
            dataList = [...(families.all_yearly || []), ...(families.all_semester || []), ...(families.mixed || [])]
          }
        } else if (res.data && Array.isArray(res.data)) {
          dataList = res.data
        } else if (res.results && Array.isArray(res.results)) {
          dataList = res.results
        }
        this.allFamilyOptions = dataList
        this.familyOptions = dataList
        console.log('家庭编号列表:', dataList)
      } catch (error) {
        console.error('获取家庭编号列表失败:', error)
        this.allFamilyOptions = []
        this.familyOptions = []
      }
    },
    
    // 处理家庭编号模糊搜索
    handleFamilySearch(query) {
      if (query) {
        this.familyLoading = true
        // 本地模糊匹配
        this.familyOptions = this.allFamilyOptions.filter(item => {
          return item.toLowerCase().includes(query.toLowerCase())
        })
        this.familyLoading = false
      } else {
        this.familyOptions = this.allFamilyOptions
      }
    },
    
    handleSearch() {
      this.listQuery.page = 1
      this.getList()
    },
    
    handleReset() {
      this.listQuery = {
        page: 1,
        page_size: 20,
        invoice_no: '',
        search: '',
        payment_type: '',
        academic_year: '',
        is_teacher_child: '',
        email_sent: ''
      }
      this.getList()
    },
    
    // 处理日期变化，自动计算学费期间和天数
    handleDateChange() {
      const start = this.tuitionForm.start_date
      const end = this.tuitionForm.end_date
      
      if (start && end) {
        const startDate = new Date(start)
        const endDate = new Date(end)
        
        // 验证开始日期不晚于结束日期
        if (startDate > endDate) {
          this.$message.warning('开始日期不能晚于结束日期')
          return
        }
        
        // 生成学费期间字符串格式：2025.08.18-2026.06.19
        const formatDate = (date) => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}.${month}.${day}`
        }
        
        this.tuitionForm.tuition_period = `${formatDate(startDate)}-${formatDate(endDate)}`
        
        // 计算天数（包含起止日期）
        const diffTime = Math.abs(endDate - startDate)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        this.tuitionForm.tuition_period_days = diffDays
      } else {
        this.tuitionForm.tuition_period = ''
        this.tuitionForm.tuition_period_days = null
      }
    },
    
    handleSizeChange(val) {
      this.listQuery.page = 1
      this.listQuery.page_size = val
      this.getList()
    },
    
    handleCurrentChange(val) {
      this.listQuery.page = val
      this.getList()
    },
    
    handleSelectionChange(val) {
      this.selectedRows = val
    },
    
    handleAdd() {
      this.isEdit = false
      this.editOriginData = null
      this.dialogTitle = '新增学费信息'
      const cfg = this.PAYMENT_TYPE_CONFIG
      this.paymentTypeGroup = cfg.YEARLY.group
      this.tuitionForm = {
        id: null,
        student: null,
        invoice_no: '',
        academic_year: '2025-2026',
        is_teacher_child: false,
        payment_type: cfg.YEARLY.value,
        tuition_period: '',
        tuition_period_days: null,
        start_date: null,
        end_date: null,
        semester: null,
        registration_fee: null,
        discount_company: 0,
        discount_alumni: 0,
        discount_sibling: 0,
        scholarship_amount: 0
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.tuitionForm && this.$refs.tuitionForm.clearValidate()
      })
    },
    
    // 支付方式变化处理
    handlePaymentTypeChange(val) {
      const cfg = this.PAYMENT_TYPE_CONFIG
      if (val === cfg.YEARLY.group) {
        this.tuitionForm.semester = null
        this.tuitionForm.payment_type = cfg.YEARLY.value
      } else {
        this.tuitionForm.payment_type = cfg.SEMESTER_1.value
        this.updatePaymentTypeBySemester()
      }
    },
    
    // 根据选择的学期更新 payment_type
    handleSemesterChange(semesterId) {
      this.updatePaymentTypeBySemester()
    },
    
    // 根据学期选项更新 payment_type
    updatePaymentTypeBySemester() {
      const cfg = this.PAYMENT_TYPE_CONFIG
      const semesterId = this.tuitionForm.semester
      if (!semesterId) return
      
      const selected = this.semesterOptions.find(item => item.id == semesterId)
      if (!selected) return
      
      let num = selected.semester_number
      if (num == null && selected.name) {
        if (selected.name.includes('一') || selected.name.includes('1')) num = 1
        else if (selected.name.includes('二') || selected.name.includes('2')) num = 2
      }
      
      if (num == 1) this.tuitionForm.payment_type = cfg.SEMESTER_1.value
      else if (num == 2) this.tuitionForm.payment_type = cfg.SEMESTER_2.value
    },
    
    handleEdit(row) {
      this.isEdit = true
      this.dialogTitle = '编辑学费信息'
      // 解析学费期间，提取开始和结束日期
      let startDate = null
      let endDate = null
      if (row.tuition_period && row.tuition_period.includes('-')) {
        const parts = row.tuition_period.split('-')
        if (parts.length === 2) {
          // 将 2025.08.18 格式转换为 2025-08-18 格式
          startDate = parts[0].replace(/\./g, '-')
          endDate = parts[1].replace(/\./g, '-')
        }
      }
      // 根据 payment_type 确定 paymentTypeGroup
      const cfg = this.PAYMENT_TYPE_CONFIG
      const isSemester = row.payment_type === cfg.SEMESTER_1.value || row.payment_type === cfg.SEMESTER_2.value
      this.paymentTypeGroup = isSemester ? cfg.SEMESTER_1.group : cfg.YEARLY.group
      
      // 保存原始数据，用于对比变化
      this.editOriginData = {
        student: row.student,
        invoice_no: row.invoice_no || '',
        academic_year: row.academic_year || '2025-2026',
        is_teacher_child: !!row.is_teacher_child,
        payment_type: row.payment_type || 'yearly',
        tuition_period: row.tuition_period || '',
        tuition_period_days: row.tuition_period_days || null,
        semester: row.semester || null,
        registration_fee: row.registration_fee ? parseFloat(row.registration_fee) : null,
        discount_company: parseFloat(row.discount_company) || 0,
        discount_alumni: parseFloat(row.discount_alumni) || 0,
        discount_sibling: parseFloat(row.discount_sibling) || 0,
        scholarship_amount: parseFloat(row.scholarship_amount) || 0
      }
      
      this.tuitionForm = { 
        id: row.id,
        student: row.student,
        invoice_no: row.invoice_no || '',
        academic_year: row.academic_year || '2025-2026',
        is_teacher_child: !!row.is_teacher_child,
        payment_type: row.payment_type || 'yearly',
        tuition_period: row.tuition_period || '',
        tuition_period_days: row.tuition_period_days || null,
        start_date: startDate,
        end_date: endDate,
        semester: row.semester || null,
        registration_fee: parseFloat(row.registration_fee) || null,
        discount_company: parseFloat(row.discount_company) || 0,
        discount_alumni: parseFloat(row.discount_alumni) || 0,
        discount_sibling: parseFloat(row.discount_sibling) || 0,
        scholarship_amount: parseFloat(row.scholarship_amount) || 0
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.tuitionForm && this.$refs.tuitionForm.clearValidate()
      })
    },
    
    async handleViewDetail(row) {
      this.detailStudentId = row.student_id
      // 默认使用当前学期（is_current=true）
      this.detailSemesterId = this.currentSemesterConfig ? this.currentSemesterConfig.id : null
      await this.calculateStudentDetail()
    },
    
    // 计算学生详情
    async calculateStudentDetail() {
      try {
        const params = {
          action: 'calculate_student',
          student_id: this.detailStudentId
        }
        
        // 使用选中的学期配置ID（默认是当前学期）
        if (this.detailSemesterId) {
          params.semester_config_id = this.detailSemesterId
          console.log('使用学期配置ID:', this.detailSemesterId)
        } else if (this.currentSemesterConfig) {
          // 如果没有选中且存在当前学期配置，使用当前学期
          params.semester_config_id = this.currentSemesterConfig.id
          console.log('使用当前学期配置:', this.currentSemesterConfig.name)
        }
        
        const res = await this.$http.post('/tuition/calculate/', params)
        
        // 获取当前行数据补充学生信息
        const row = this.list.find(item => item.student_id === this.detailStudentId) || {}
        
        // 后端返回的数据格式: { student_id, invoice_no, child_order, tuition_detail }
        const tuitionDetail = res.data.tuition_detail || res.data
        
        this.detailData = {
          ...tuitionDetail,
          student_id: res.data.student_id || this.detailStudentId,
          invoice_no: res.data.invoice_no || row.invoice_no,
          child_order: res.data.child_order,
          student_name: tuitionDetail.student_name || row.student_name,
          grade: tuitionDetail.grade || row.student_class_name
        }
        this.detailDialogVisible = true
      } catch (error) {
        this.$message.error('获取详情失败')
      }
    },
    
    // 详情对话框学期切换
    handleDetailSemesterChange(val) {
      this.detailSemesterId = val
    },
    
    // 重新计算详情
    async recalculateDetail() {
      if (!this.detailSemesterId) {
        this.$message.warning('请先选择学期')
        return
      }
      await this.calculateStudentDetail()
      this.$message.success('重新计算完成')
    },
    
    async handleDelete(row) {
      try {
        await this.$confirm('确认删除该学费信息?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await this.$http.delete(`/studenttuitioninfo/${row.id}/`)
        this.$message.success('删除成功')
        this.getList()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
        }
      }
    },
    
    async handleSubmit() {
      this.$refs.tuitionForm.validate(async(valid) => {
        if (valid) {
          try {
            // 在提交前再次确保 payment_type 正确
            if (this.paymentTypeGroup === 'semester' && this.tuitionForm.semester) {
              this.updatePaymentTypeBySemester()
            } else if (this.paymentTypeGroup === 'yearly') {
              this.tuitionForm.payment_type = this.PAYMENT_TYPE_CONFIG.YEARLY.value
            }
            
            const cfg = this.PAYMENT_TYPE_CONFIG
            const form = this.tuitionForm
            
            // 计算 semester 值
            let semesterValue = 0
            if (form.payment_type === cfg.SEMESTER_1.value) semesterValue = 1
            else if (form.payment_type === cfg.SEMESTER_2.value) semesterValue = 2
            
            // 构建完整提交数据
            const fullData = {
              student: form.student,
              invoice_no: form.invoice_no,
              academic_year: form.academic_year,
              is_teacher_child: form.is_teacher_child,
              payment_type: form.payment_type,
              tuition_period: form.tuition_period,
              tuition_period_days: form.tuition_period_days ? parseInt(form.tuition_period_days) : null,
              semester: semesterValue,
              registration_fee: form.registration_fee ? parseFloat(form.registration_fee) : null,
              scholarship_amount: parseFloat(form.scholarship_amount) || 0,
              discount_company: parseFloat(form.discount_company) || 0,
              discount_alumni: parseFloat(form.discount_alumni) || 0,
              discount_sibling: parseFloat(form.discount_sibling) || 0
            }
            
            let submitData
            
            if (this.isEdit) {
              // 编辑模式：只提交变化的值
              submitData = {}
              const origin = this.editOriginData
              
              // 对比每个字段，只添加变化的值
              for (const key in fullData) {
                const newVal = fullData[key]
                const oldVal = origin[key]
                
                // 处理数字精度问题（浮点数比较）
                if (typeof newVal === 'number' && typeof oldVal === 'number') {
                  if (Math.abs(newVal - oldVal) > 0.001) {
                    submitData[key] = newVal
                  }
                } else if (newVal !== oldVal) {
                  submitData[key] = newVal
                }
              }
              
              // 如果没有变化，提示用户
              if (Object.keys(submitData).length === 0) {
                this.$message.info('没有修改任何数据')
                this.dialogVisible = false
                return
              }
              
              console.log('编辑提交（仅变化字段）:', submitData)
              await this.$http.patch(`/studenttuitioninfo/${form.id}/`, submitData)
              this.$message.success('更新成功')
            } else {
              // 新增模式：提交所有字段
              submitData = fullData
              console.log('新增提交:', submitData)
              await this.$http.post('/studenttuitioninfo/', submitData)
              this.$message.success('新增成功')
            }
            this.dialogVisible = false
            this.getList()
          } catch (error) {
            console.error('提交失败:', error)
            this.$message.error(this.isEdit ? '更新失败' : '新增失败')
          }
        }
      })
    },
    
    async handleBatchEmail() {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请选择要发送邮件的学生')
        return
      }
      try {
        const invoiceNos = [...new Set(this.selectedRows.map(row => row.invoice_no))]
        await this.$http.post('/tuition/email/', {
          action: 'send_batch',
          invoice_nos: invoiceNos
        })
        this.$message.success('邮件发送成功')
        this.getList()
      } catch (error) {
        this.$message.error('邮件发送失败')
      }
    },
    
    handleExport() {
      this.$message.info('导出功能开发中...')
    },
    
    handleImport() {
      this.importDialogVisible = true
    },
    
    beforeUpload(file) {
      // 验证是否选择了学年
      if (!this.importForm.academic_year) {
        this.$message.error('请先选择学年!')
        return false
      }
      
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                      file.type === 'application/vnd.ms-excel' ||
                      file.name.endsWith('.xlsx') || 
                      file.name.endsWith('.xls')
      const isLt10M = file.size / 1024 / 1024 < 10

      if (!isExcel) {
        this.$message.error('只能上传 Excel 文件!')
        return false
      }
      if (!isLt10M) {
        this.$message.error('文件大小不能超过 10MB!')
        return false
      }
      return true
    },
    
    handleUploadSuccess(response) {
      if (response.code === 1 || response.success) {
        const successCount = response.data?.success_count || response.success_count || 0
        const failCount = response.data?.fail_count || response.fail_count || 0
        const message = response.data?.message || response.message || '导入成功'
        
        this.$alert(
          `<div style="text-align: center;">
            <i class="el-icon-success" style="font-size: 48px; color: #67c23a; margin-bottom: 15px;"></i>
            <div style="font-size: 16px; margin-bottom: 10px;">${message}</div>
            <div style="color: #909399;">
              成功导入: <span style="color: #67c23a; font-weight: bold;">${successCount}</span> 条记录
              ${failCount > 0 ? `<br>失败: <span style="color: #f56c6c; font-weight: bold;">${failCount}</span> 条记录` : ''}
            </div>
          </div>`,
          '导入完成',
          {
            confirmButtonText: '确定',
            dangerouslyUseHTMLString: true,
            callback: () => {
              this.importDialogVisible = false
              this.getList()
            }
          }
        )
      } else {
        this.$message.error(response.message || '导入失败')
      }
    },
    
    handleUploadError(error) {
      let message = '导入失败'
      try {
        const errorObj = JSON.parse(error.message)
        message = errorObj.message || errorObj.error || '导入失败'
      } catch (e) {
        message = error.message || '导入失败'
      }
      this.$message.error(message)
    },
    
    handleDownloadTemplate() {
      // 下载导入模板
      const templateUrl = '/sljt/tuition/excel/template/'
      window.open(templateUrl, '_blank')
      this.$message.success('模板下载中...')
    }
  }
}
</script>

<style lang="scss" scoped>
.filter-container {
  .el-form-item {
    margin-bottom: 10px;
    margin-right: 0;
  }
}

.discount-tag {
  margin-right: 5px;
}

.amount-text {
  color: #f56c6c;
  font-weight: bold;
}

.discount-text {
  color: #67c23a;
}

.form-tip {
  margin-left: 5px;
  color: #909399;
  font-size: 12px;
}
</style>
