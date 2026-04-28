<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <el-card class="filter-container search-header" shadow="never">
      <el-form :inline="true" :model="listQuery" class="demo-form-inline">
        <el-row :gutter="10">
          <el-col :span="6">
            <el-form-item label="invoice_no 号码：" style="width: 100%;">
              <el-select
                v-model="listQuery.invoice_no"
                placeholder="请选择或输入invoice_no 号码"
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
        <el-button type="warning" icon="el-icon-download" @click="handleExport">导出</el-button>
        <el-button icon="el-icon-refresh" @click="refreshCache">刷新</el-button>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-container" shadow="never" style="margin-top: 15px;">
      <el-table
        ref="dataTable"
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

        <el-table-column label="学生" align="center" min-width="180">
          <template slot-scope="scope">
            <div style="font-weight: bold;">{{ scope.row.student_name }}</div>
            <div style="color: #c0c4cc; font-size: 12px;">学号: {{ scope.row.student_no_xf }}</div>
          </template>
        </el-table-column>
        <el-table-column label="年级" prop="grade" align="center" min-width="100" />
        <el-table-column label="invoice_no 号码" prop="family_number" align="center" min-width="120" />
        <el-table-column label="学年" prop="academic_year" align="center" width="100" />
        <el-table-column label="出生日期" align="center" width="110">
          <template slot-scope="scope">
            <span v-if="scope.row.dob">{{ scope.row.dob }}</span>
            <span v-else style="color: #c0c4cc;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="入学日期" align="center" width="110">
          <template slot-scope="scope">
            <span v-if="scope.row.enrollment_date">{{ scope.row.enrollment_date }}</span>
            <span v-else style="color: #c0c4cc;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="家长邮箱1" align="center" min-width="160">
          <template slot-scope="scope">
            <span v-if="scope.row.parent1_email_address" style="font-size: 12px;">{{ scope.row.parent1_email_address }}</span>
            <span v-else style="color: #c0c4cc;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="家长邮箱2" align="center" min-width="160">
          <template slot-scope="scope">
            <span v-if="scope.row.parent2_email_address" style="font-size: 12px;">{{ scope.row.parent2_email_address }}</span>
            <span v-else style="color: #c0c4cc;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="折扣类型" align="center" min-width="220">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.is_teacher_child" type="danger" size="small" class="discount-tag">教师子弟</el-tag>
            <el-tag v-if="scope.row.discount_sibling > 0" type="primary" size="small" class="discount-tag">兄弟姐妹</el-tag>
            <el-tag v-if="scope.row.discount_company > 0" type="warning" size="small" class="discount-tag">公司折扣</el-tag>
            <el-tag v-if="scope.row.discount_alumni > 0" type="success" size="small" class="discount-tag">校友</el-tag>
            <el-tag v-if="scope.row.scholarship_amount > 0" type="info" size="small" class="discount-tag">奖学金 ¥{{ scope.row.scholarship_amount }}</el-tag>
            <el-tag v-if="scope.row.scholarship_discount_rate > 0" type="info" size="small" class="discount-tag">奖学金比例 {{ scope.row.scholarship_discount_rate }}%</el-tag>
            <el-tag v-if="scope.row.financial_aid_discount_rate > 0" type="info" size="small" class="discount-tag">助学金比例 {{ scope.row.financial_aid_discount_rate }}%</el-tag>
            <span v-if="!scope.row.is_teacher_child && !(scope.row.discount_sibling > 0) && !(scope.row.discount_company > 0) && !(scope.row.discount_alumni > 0) && !(scope.row.scholarship_amount > 0) && !(scope.row.scholarship_discount_rate > 0) && !(scope.row.financial_aid_discount_rate > 0)">-</span>
          </template>
        </el-table-column>

        <el-table-column label="邮件状态" align="center" width="120">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.email_sent" type="success" size="small">已发送</el-tag>
            <el-tag v-else type="info" size="small">未发送</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="250" fixed="right">
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
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="800px">
      <el-form ref="tuitionForm" :model="tuitionForm" :rules="rules" label-width="140px">
        <!-- 基本信息 -->
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="选择学生">
              <div v-if="isEdit" style="line-height: 36px; padding: 0 15px; border: 1px solid #dcdfe6; border-radius: 4px; background-color: #f5f7fa;">
                {{ tuitionForm.student_name }}
                <span v-if="tuitionForm.student_no_xf" style="color: #909399; font-size: 12px;">({{ tuitionForm.student_no_xf }})</span>
              </div>
              <el-select
                v-else
                v-model="tuitionForm.student"
                placeholder="请选择已有学生（可选）"
                filterable
                clearable
                style="width: 100%;"
                @change="handleStudentSelect"
              >
                <el-option
                  v-for="item in studentOptions"
                  :key="item.id"
                  :label="`${item.last_name} ${item.first_name} (${item.english_name})`"
                  :value="item.id"
                />
              </el-select>
              <span v-if="!isEdit" class="form-tip">选择学生可自动填充信息，也可直接输入下方信息创建新记录</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学号" prop="student_no_xf">
              <el-input v-model="tuitionForm.student_no_xf" placeholder="请输入学号" :disabled="isEdit" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学生姓名">
              <el-input v-model="tuitionForm.student_name" placeholder="请输入学生姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年级">
              <el-input v-model="tuitionForm.grade" placeholder="请输入年级，如 P1, M1" />
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
            <el-form-item label="invoice_no 号码" prop="invoice_no">
              <el-input v-model="tuitionForm.invoice_no" placeholder="请输入invoice_no 号码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="原始家庭编号">
              <el-input v-model="tuitionForm.family_number" placeholder="请输入原始家庭编号" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 个人信息 -->
        <el-divider content-position="left">个人信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出生日期">
              <el-date-picker v-model="tuitionForm.dob" type="date" placeholder="选择出生日期" value-format="yyyy-MM-dd" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入学日期">
              <el-date-picker v-model="tuitionForm.enrollment_date" type="date" placeholder="选择入学日期" value-format="yyyy-MM-dd" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="家长邮箱1">
              <el-input v-model="tuitionForm.parent1_email_address" placeholder="请输入家长邮箱1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="家长邮箱2">
              <el-input v-model="tuitionForm.parent2_email_address" placeholder="请输入家长邮箱2" />
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
          <el-col :span="12">
            <el-form-item label="需要校车">
              <el-switch v-model="tuitionForm.needs_school_bus" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="教师子弟">
              <el-switch v-model="tuitionForm.is_teacher_child" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 折扣信息 -->
        <el-divider content-position="left">折扣信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="兄弟姐妹折扣">
              <el-input-number v-model="tuitionForm.discount_sibling" :min="0" :precision="2" :controls="true" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公司折扣">
              <el-input-number v-model="tuitionForm.discount_company" :min="0" :precision="2" :controls="true" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="校友折扣">
              <el-input-number v-model="tuitionForm.discount_alumni" :min="0" :precision="2" :controls="true" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="奖学金金额">
              <el-input-number v-model="tuitionForm.scholarship_amount" :min="0" :precision="2" :controls="true" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="奖学金折扣(%)">
              <el-input-number v-model="tuitionForm.scholarship_discount_rate" :min="0" :max="100" :precision="2" :controls="true" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="助学金">
              <el-input-number v-model="tuitionForm.financial_aid" :min="0" :precision="2" :controls="true" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="助学金折扣(%)">
              <el-input-number v-model="tuitionForm.financial_aid_discount_rate" :min="0" :max="100" :precision="2" :controls="true" controls-position="right" style="width: 100%;" />
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
        :headers="uploadHeaders"
        :data="importForm"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :on-progress="handleUploadProgress"
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

    <!-- 导出对话框 -->
    <el-dialog title="导出学生学费信息" :visible.sync="exportDialogVisible" width="450px">
      <el-form ref="exportForm" :model="exportForm" label-width="120px">
        <el-form-item label="学年">
          <el-select v-model="exportForm.academic_year" placeholder="请选择或输入学年" style="width: 100%;" filterable allow-create default-first-option clearable>
            <el-option v-for="year in academicYearOptions" :key="year" :label="year" :value="year" />
          </el-select>
          <div style="color: #909399; font-size: 12px; margin-top: 5px;">留空则导出所有学年</div>
        </el-form-item>
        <el-form-item label="年级是否升级">
          <el-switch v-model="exportForm.upgrade_grade" active-text="是" inactive-text="否" />
          <div style="color: #909399; font-size: 12px; margin-top: 5px;">开启后 P1→P2, M1→M2, DP1→DP2, DP2不升级</div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" icon="el-icon-download" @click="submitExport">导出</el-button>
      </div>
    </el-dialog>

    <!-- 发送邮件对话框 -->
    <el-dialog :title="isResend ? '重新发送学费邮件' : '发送学费邮件'" :visible.sync="emailDialogVisible" width="600px">
      <el-form v-if="currentEmailRow" label-width="100px">
        <el-form-item label="invoice_no 号码">
          <span>{{ currentEmailRow.family_number || currentEmailRow.invoice_no }}</span>
        </el-form-item>
        <el-form-item label="学生">
          <span>{{ currentEmailRow.student_name || currentEmailRow.student_english_name || '-' }}</span>
        </el-form-item>
        <el-form-item label="邮件状态">
          <el-tag v-if="currentEmailRow.email_sent" type="success">已发送</el-tag>
          <el-tag v-else type="info">未发送</el-tag>
        </el-form-item>
        <el-form-item label="附加附件">
          <el-upload
            ref="emailAttachmentUpload"
            action="#"
            :auto-upload="false"
            :on-change="handleEmailAttachmentChange"
            :on-remove="handleEmailAttachmentRemove"
            :file-list="emailAttachmentList"
            multiple
            drag
          >
            <i class="el-icon-upload" />
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <div slot="tip" class="el-upload__tip">支持PDF、Word、Excel、图片等格式，单文件不超过10MB</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="emailDialogVisible = false">取消</el-button>
        <el-button type="success" :loading="emailSending" @click="submitSendEmail">
          {{ isResend ? '重新发送' : '发送邮件' }}
        </el-button>
      </div>
    </el-dialog>

    <!-- 学费详情对话框 -->
    <el-dialog title="学费详情" :visible.sync="detailDialogVisible" width="700px">
      <div v-if="detailData">
        <!-- 学生基本信息 -->
        <el-descriptions :column="2" border title="学生信息">
          <el-descriptions-item label="学生">{{ detailData.student_name }}</el-descriptions-item>
          <el-descriptions-item label="invoice_no 号码">{{ detailData.family_number || detailData.invoice_no }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ detailData.grade }}</el-descriptions-item>
          <el-descriptions-item label="学年">{{ detailData.academic_year }}</el-descriptions-item>
        </el-descriptions>

        <!-- 费用明细 -->
        <el-descriptions :column="2" border title="费用明细" style="margin-top: 15px;">
          <el-descriptions-item label="注册费">
            <span>¥{{ detailData.registration_fee }}</span>
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
          <el-descriptions-item label="奖学金比例">
            <span v-if="detailData.scholarship_discount_rate > 0" class="discount-text">
              {{ detailData.scholarship_discount_rate }}%
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="助学金">
            <span v-if="detailData.financial_aid > 0" class="discount-text">
              -¥{{ detailData.financial_aid }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="助学金比例">
            <span v-if="detailData.financial_aid_discount_rate > 0" class="discount-text">
              {{ detailData.financial_aid_discount_rate }}%
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="折扣后学费">
            <span>¥{{ (detailData.final_tuition || 0).toFixed(2) }}</span>
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
import { getToken } from '@/utils/auth'

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
      currentSemesterConfig: null, // 当前启用的学期配置
      familyOptions: [],
      familyLoading: false,
      allFamilyOptions: [],
      selectedRows: [],
      downloadAllLoading: false,
      academicYearOptions: ['2025-2026', '2024-2025', '2023-2024'],
      listQuery: {
        page: 1,
        page_size: 20,
        invoice_no: '',
        search: '',
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
      uploadHeaders: {
        'Authorization': 'Bearer ' + getToken()
      },
      importForm: {
        academic_year: ''
      },
      exportDialogVisible: false,
      exportForm: {
        upgrade_grade: false,
        academic_year: ''
      },
      tuitionForm: {
        id: null,
        student: null,
        invoice_no: '',
        academic_year: '',
        is_teacher_child: false,
        registration_fee: null,
        discount_company: 0,
        discount_alumni: 0,
        discount_sibling: 0,
        scholarship_amount: 0,
        scholarship_discount_rate: 0,
        financial_aid: 0,
        financial_aid_discount_rate: 0
      },
      detailData: null,
      editOriginData: null, // 编辑时保存原始数据，用于对比变化
      // 邮件发送对话框
      emailDialogVisible: false,
      emailAttachmentList: [],
      currentEmailRow: null,
      isResend: false, // 标记是否为重新发送
      emailSending: false,
      rules: {
        student_no_xf: [{ required: true, message: '请输入学号', trigger: 'blur' }],
        invoice_no: [{ required: true, message: '请输入invoice_no 号码', trigger: 'blur' }]
      }
    }
  },
  async created() {
    // 初始化默认学年（从计算规则配置中获取启用的学年）
    await this.initDefaultAcademicYear()
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
    // 获取默认学年（当前年份-当前年份+1）
    getDefaultAcademicYear() {
      const currentYear = new Date().getFullYear()
      const nextYear = currentYear + 1
      return `${currentYear}-${nextYear}`
    },

    // 初始化默认学年（从计算规则配置中获取启用的学年）
    async initDefaultAcademicYear() {
      try {
        const res = await this.$http.get('/tuitioncalculationconfig/')
        let configs = []
        if (Array.isArray(res)) {
          configs = res
        } else if (res.results && Array.isArray(res.results)) {
          configs = res.results
        } else if (res.data && Array.isArray(res.data)) {
          configs = res.data
        }

        // 提取所有学年选项并排序（降序）
        const years = new Set()
        configs.forEach(item => {
          if (item.academic_year) years.add(item.academic_year)
        })
        if (years.size > 0) {
          this.academicYearOptions = Array.from(years).sort((a, b) => b.localeCompare(a))
        }

        // 获取启用的配置
        const activeConfig = configs.find(c => c.is_active)
        const defaultYear = activeConfig ? activeConfig.academic_year : this.getDefaultAcademicYear()

        this.listQuery.academic_year = defaultYear
        this.importForm.academic_year = defaultYear
        this.tuitionForm.academic_year = defaultYear
        console.log('默认启用学年:', defaultYear)
      } catch (error) {
        console.error('获取默认学年失败:', error)
        const fallbackYear = this.getDefaultAcademicYear()
        this.listQuery.academic_year = fallbackYear
        this.importForm.academic_year = fallbackYear
        this.tuitionForm.academic_year = fallbackYear
      }
    },

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

    // 将列表数据中的学年补充到选项中（计算规则为主要来源）
    extractAcademicYears() {
      const years = new Set(this.academicYearOptions)
      this.list.forEach(item => {
        if (item.academic_year) {
          years.add(item.academic_year)
        }
      })
      // 确保当前筛选的默认学年也在选项中
      if (this.listQuery.academic_year) {
        years.add(this.listQuery.academic_year)
      }
      // 转为数组并按降序排序
      this.academicYearOptions = Array.from(years).sort((a, b) => b.localeCompare(a))
      console.log('合并后的学年列表:', this.academicYearOptions)
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
          scholarship_discount_rate: parseFloat(item.scholarship_discount_rate) || 0,
          financial_aid: parseFloat(item.financial_aid) || 0,
          financial_aid_discount_rate: parseFloat(item.financial_aid_discount_rate) || 0,
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

    // 获取学生选项（只显示没有学费信息的学生）
    async getStudentOptions() {
      try {
        // 获取所有学生列表（不过滤，允许为同一学生创建不同学年的学费信息）
        const studentsRes = await this.getAllStudents()

        console.log('所有学生数量:', studentsRes.length)
        console.log('学生名单:', studentsRes.map(s => ({ id: s.id, name: s.english_name || s.last_name + s.first_name })))

        this.studentOptions = studentsRes
      } catch (error) {
        console.error('获取学生列表失败:', error)
        this.studentOptions = []
      }
    },

    // 获取学期选项
    async getSemesterOptions() {
      try {
        // 获取所有学期
        const res = await this.$http.get('/semester/', { params: { ordering: '-academic_year,semester' }})
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

        // 使用第一个启用的学期作为当前学期
        if (results.length > 0) {
          const activeConfig = results.find(item => item.is_active)
          if (activeConfig) {
            this.currentSemesterConfig = activeConfig
            console.log('当前学期:', activeConfig.name)
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
        const params = { type: 'families' }
        if (this.listQuery.academic_year) {
          params.academic_year = this.listQuery.academic_year
        }
        const res = await this.$http.get('/tuition/calculate/', { params })
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
      this.getFamilyOptions()
    },

    handleReset() {
      this.listQuery = {
        page: 1,
        page_size: 20,
        invoice_no: '',
        search: '',
        academic_year: '',
        is_teacher_child: '',
        email_sent: ''
      }
      this.getList()
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
      this.tuitionForm = {
        id: null,
        student: null,
        student_name: '',
        student_no_xf: '',
        invoice_no: '',
        family_number: '',
        academic_year: '2025-2026',
        grade: '',

        dob: null,
        enrollment_date: null,
        parent1_email_address: '',
        parent2_email_address: '',
        registration_fee: null,
        needs_school_bus: true,
        is_teacher_child: false,
        discount_sibling: 0,
        discount_company: 0,
        discount_alumni: 0,
        scholarship_amount: 0,
        scholarship_discount_rate: 0,
        financial_aid: 0,
        financial_aid_discount_rate: 0
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.tuitionForm && this.$refs.tuitionForm.clearValidate()
      })
    },

    // 选择学生时自动填充信息
    handleStudentSelect(studentId) {
      if (!studentId) return

      const student = this.studentOptions.find(item => item.id === studentId)
      if (student) {
        // 自动填充学号和学生姓名
        this.tuitionForm.student_no_xf = student.student_no || ''
        const fullName = `${student.last_name || ''} ${student.first_name || ''}`.trim()
        this.tuitionForm.student_name = fullName || student.english_name || ''

        // 自动填充年级（如果有）
        if (student.class_name) {
          this.tuitionForm.grade = student.class_name
        }

        // 自动填充出生日期
        if (student.dob) {
          this.tuitionForm.dob = student.dob
        }

        // 自动填充入学日期
        if (student.enrollment_date) {
          this.tuitionForm.enrollment_date = student.enrollment_date
        }

        // 自动填充家长邮箱
        if (student.parent1_email_address) {
          this.tuitionForm.parent1_email_address = student.parent1_email_address
        }
        if (student.parent2_email_address) {
          this.tuitionForm.parent2_email_address = student.parent2_email_address
        }

        this.$message.success(`已自动填充学生信息：${fullName}`)
      }
    },

    handleEdit(row) {
      this.isEdit = true
      this.dialogTitle = '编辑学费信息'

      // 保存原始数据，用于对比变化
      this.editOriginData = {
        student_name: row.student_name || '',
        student_no_xf: row.student_no_xf || '',
        invoice_no: row.invoice_no || '',
        family_number: row.family_number || '',
        academic_year: row.academic_year || '2025-2026',
        grade: row.grade || '',

        dob: row.dob || null,
        enrollment_date: row.enrollment_date || null,
        parent1_email_address: row.parent1_email_address || '',
        parent2_email_address: row.parent2_email_address || '',
        registration_fee: row.registration_fee ? parseFloat(row.registration_fee) : null,
        needs_school_bus: !!row.needs_school_bus,
        is_teacher_child: !!row.is_teacher_child,
        discount_sibling: parseFloat(row.discount_sibling) || 0,
        discount_company: parseFloat(row.discount_company) || 0,
        discount_alumni: parseFloat(row.discount_alumni) || 0,
        scholarship_amount: parseFloat(row.scholarship_amount) || 0,
        scholarship_discount_rate: parseFloat(row.scholarship_discount_rate) || 0,
        financial_aid: parseFloat(row.financial_aid) || 0,
        financial_aid_discount_rate: parseFloat(row.financial_aid_discount_rate) || 0
      }

      this.tuitionForm = {
        id: row.id,
        student: row.student,
        student_name: row.student_name || '',
        student_no_xf: row.student_no_xf || '',
        invoice_no: row.invoice_no || '',
        family_number: row.family_number || '',
        academic_year: row.academic_year || '2025-2026',
        grade: row.grade || '',
        dob: row.dob || null,
        enrollment_date: row.enrollment_date || null,
        parent1_email_address: row.parent1_email_address || '',
        parent2_email_address: row.parent2_email_address || '',
        registration_fee: parseFloat(row.registration_fee) || null,
        needs_school_bus: row.needs_school_bus !== false,
        is_teacher_child: !!row.is_teacher_child,
        discount_sibling: parseFloat(row.discount_sibling) || 0,
        discount_company: parseFloat(row.discount_company) || 0,
        discount_alumni: parseFloat(row.discount_alumni) || 0,
        scholarship_amount: parseFloat(row.scholarship_amount) || 0,
        scholarship_discount_rate: parseFloat(row.scholarship_discount_rate) || 0,
        financial_aid: parseFloat(row.financial_aid) || 0,
        financial_aid_discount_rate: parseFloat(row.financial_aid_discount_rate) || 0
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.tuitionForm && this.$refs.tuitionForm.clearValidate()
      })
    },

    async handleViewDetail(row) {
      try {
        const params = {
          action: 'calculate_student',
          tuition_info_id: row.id
        }

        // 使用当前学期配置
        if (this.currentSemesterConfig) {
          params.semester_id = this.currentSemesterConfig.id
          console.log('使用当前学期:', this.currentSemesterConfig.name)
        }

        const res = await this.$http.post('/tuition/calculate/', params)

        // 后端返回的数据格式: { student_id, invoice_no, child_order, tuition_detail }
        const tuitionDetail = res.data.tuition_detail || res.data

        this.detailData = {
          ...tuitionDetail,
          invoice_no: res.data.invoice_no || row.invoice_no,
          child_order: res.data.child_order,
          student_name: tuitionDetail.student_name || row.student_name,
          grade: tuitionDetail.grade || row.student_class_name,
          academic_year: row.academic_year
        }
        this.detailDialogVisible = true
      } catch (error) {
        this.$message.error('获取详情失败')
      }
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

    // 打开发送邮件对话框
    handleSendEmail(row) {
      this.currentEmailRow = row
      this.isResend = false
      this.emailAttachmentList = []
      this.emailDialogVisible = true
    },

    // 打开重新发送邮件对话框
    handleResendEmail(row) {
      this.currentEmailRow = row
      this.isResend = true
      this.emailAttachmentList = []
      this.emailDialogVisible = true
    },

    // 处理附件选择
    handleEmailAttachmentChange(file, fileList) {
      this.emailAttachmentList = fileList
    },

    // 处理附件移除
    handleEmailAttachmentRemove(file, fileList) {
      this.emailAttachmentList = fileList
    },

    // 提交发送邮件（带附件）
    async submitSendEmail() {
      if (!this.currentEmailRow) {
        this.$message.warning('请选择要发送邮件的家庭')
        return
      }

      this.emailSending = true
      try {
        const formData = new FormData()
        formData.append('action', 'send_single')
        formData.append('invoice_no', this.currentEmailRow.invoice_no)
        formData.append('academic_year', this.currentEmailRow.academic_year || '')

        if (this.isResend) {
          formData.append('force_resend', 'true')
        }

        // 添加附件
        this.emailAttachmentList.forEach(file => {
          formData.append('attachments', file.raw)
        })

        const data = await this.$http.post('/tuition/email/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        if (data.code === 1 || data.code === '1') {
          this.$notify({
            title: this.isResend ? '邮件重新发送成功' : '邮件发送成功',
            message: `${this.currentEmailRow.invoice_no} 的学费邮件已${this.isResend ? '重新' : ''}发送`,
            type: 'success',
            duration: 5000,
            position: 'bottom-right'
          })
          // 关闭对话框
          this.emailDialogVisible = false
          this.emailAttachmentList = []
          // 刷新列表以更新邮件状态
          this.getList()
        } else {
          this.$message.error(data.message || (this.isResend ? '邮件重新发送失败' : '邮件发送失败'))
        }
      } catch (error) {
        console.error(this.isResend ? '邮件重新发送失败:' : '邮件发送失败:', error)
        this.$message.error((this.isResend ? '邮件重新发送失败：' : '邮件发送失败：') + (error.message || '网络错误'))
      } finally {
        this.emailSending = false
      }
    },

    async handleSubmit() {
      this.$refs.tuitionForm.validate(async(valid) => {
        if (valid) {
          try {
            const form = this.tuitionForm

            // 构建完整提交数据
            const fullData = {
              student: form.student,
              student_name: form.student_name,
              student_no_xf: form.student_no_xf,
              invoice_no: form.invoice_no,
              family_number: form.family_number,
              academic_year: form.academic_year,
              grade: form.grade,

              dob: form.dob,
              enrollment_date: form.enrollment_date,
              parent1_email_address: form.parent1_email_address,
              parent2_email_address: form.parent2_email_address,
              registration_fee: form.registration_fee ? parseFloat(form.registration_fee) : null,
              needs_school_bus: form.needs_school_bus,
              is_teacher_child: form.is_teacher_child,
              discount_sibling: parseFloat(form.discount_sibling) || 0,
              discount_company: parseFloat(form.discount_company) || 0,
              discount_alumni: parseFloat(form.discount_alumni) || 0,
              scholarship_amount: parseFloat(form.scholarship_amount) || 0,
              scholarship_discount_rate: parseFloat(form.scholarship_discount_rate) || 0,
              financial_aid: parseFloat(form.financial_aid) || 0,
              financial_aid_discount_rate: parseFloat(form.financial_aid_discount_rate) || 0
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
        this.$message.success('批量邮件发送任务已启动，正在后台发送中，请稍后刷新页面查看状态')
        this.getList()
      } catch (error) {
        this.$message.error('邮件发送失败')
      }
    },

    // 一键下载所有PDF
    async handleDownloadAllPdfs() {
      try {
        await this.$confirm('即将分批下载所有家庭的学费PDF文件，每批50个家庭，打包成zip格式。请耐心等待。', '确认下载', {
          confirmButtonText: '确认下载',
          cancelButtonText: '取消',
          type: 'info'
        })

        const batchSize = 50
        let batchIndex = 0
        let totalBatches = null
        let totalGenerated = 0
        let totalFailed = 0

        this.$message.info('开始批量下载PDF文件...')

        do {
          this.downloadAllLoading = true

          // 发送分批请求
          const response = await this.$http.post('/tuition/email/', {
            action: 'download_all_pdfs',
            batch_size: batchSize,
            batch_index: batchIndex
          }, {
            responseType: 'blob'
          })

          // 从响应头获取批次信息
          totalBatches = parseInt(response.headers['x-total-batches'] || 1)
          const generatedCount = parseInt(response.headers['x-generated-count'] || 0)
          const failedCount = parseInt(response.headers['x-failed-count'] || 0)

          totalGenerated += generatedCount
          totalFailed += failedCount

          // 获取文件名
          const contentDisposition = response.headers['content-disposition']
          let filename = `Tuition_Batch_${batchIndex + 1}_of_${totalBatches}.zip`
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/)
            if (filenameMatch) {
              filename = filenameMatch[1]
            }
          }

          // 下载文件
          const blob = new Blob([response.data], { type: 'application/zip' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)

          // 显示进度
          this.$message.success(`第 ${batchIndex + 1}/${totalBatches} 批下载完成，本批生成 ${generatedCount} 个PDF`)

          batchIndex++

          // 添加小延迟，避免浏览器拦截
          if (batchIndex < totalBatches) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } while (batchIndex < totalBatches)

        // 显示总结消息
        let msg = `全部下载完成！总共生成 ${totalGenerated} 个PDF文件`
        if (totalFailed > 0) {
          msg += `，${totalFailed} 个失败`
        }
        this.$message.success(msg)
      } catch (error) {
        if (error === 'cancel') {
          return
        }
        console.error('下载失败:', error)
        this.$message.error('下载失败：' + (error.message || '网络错误'))
      } finally {
        this.downloadAllLoading = false
      }
    },

    // 下载选中行的PDF
    async handleDownloadSelectedPdfs() {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请先选择要下载的学费记录')
        return
      }

      // 获取唯一的家庭编号
      const uniqueInvoiceNos = [...new Set(this.selectedRows.map(row => row.invoice_no).filter(Boolean))]
      if (uniqueInvoiceNos.length === 0) {
        this.$message.warning('选中的记录没有家庭编号')
        return
      }

      try {
        await this.$confirm(`即将下载 ${uniqueInvoiceNos.length} 个家庭的PDF文件，打包成zip格式。请稍候...`, '确认下载', {
          confirmButtonText: '确认下载',
          cancelButtonText: '取消',
          type: 'info'
        })

        const batchSize = 50
        let batchIndex = 0
        let totalBatches = null
        let totalGenerated = 0
        let totalFailed = 0

        this.downloadSelectedLoading = true
        this.$message.info('开始下载选中家庭的PDF文件...')

        do {
          const response = await this.$http.post('/tuition/email/', {
            action: 'download_all_pdfs',
            invoice_nos: uniqueInvoiceNos,
            batch_size: batchSize,
            batch_index: batchIndex
          }, {
            responseType: 'blob'
          })

          totalBatches = parseInt(response.headers['x-total-batches'] || 1)
          const generatedCount = parseInt(response.headers['x-generated-count'] || 0)
          const failedCount = parseInt(response.headers['x-failed-count'] || 0)

          totalGenerated += generatedCount
          totalFailed += failedCount

          // 获取文件名
          const contentDisposition = response.headers['content-disposition']
          let filename = `Tuition_Selected_Batch_${batchIndex + 1}_of_${totalBatches}.zip`
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/)
            if (filenameMatch) {
              filename = filenameMatch[1]
            }
          }

          // 下载文件
          const blob = new Blob([response.data], { type: 'application/zip' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)

          // 显示进度
          this.$message.success(`第 ${batchIndex + 1}/${totalBatches} 批下载完成，本批生成 ${generatedCount} 个PDF`)

          batchIndex++

          // 添加小延迟
          if (batchIndex < totalBatches) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } while (batchIndex < totalBatches)

        // 显示总结消息
        let msg = `选中家庭下载完成！总共生成 ${totalGenerated} 个PDF文件`
        if (totalFailed > 0) {
          msg += `，${totalFailed} 个失败`
        }
        this.$message.success(msg)

        // 下载完成后清空选择（不刷新页面）
        this.selectedRows = []
        // 等待 DOM 更新后清空表格选择
        await this.$nextTick()
        if (this.$refs.dataTable) {
          this.$refs.dataTable.clearSelection()
        }
      } catch (error) {
        if (error === 'cancel') {
          return
        }
        console.error('下载失败:', error)
        this.$message.error('下载失败：' + (error.message || '网络错误'))
      } finally {
        this.downloadSelectedLoading = false
      }
    },

    handleExport() {
      this.exportForm.academic_year = this.listQuery.academic_year || ''
      this.exportDialogVisible = true
    },
    async submitExport() {
      try {
        this.$message.info('正在导出，请稍候...')
        const params = {
          upgrade_grade: this.exportForm.upgrade_grade,
          academic_year: this.exportForm.academic_year
        }
        const res = await this.$http.get('/studenttuitioninfo/export/', {
          params,
          responseType: 'blob'
        })
        const blob = new Blob([res.data || res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        const filename = `学生学费信息_${this.exportForm.academic_year || '全部'}_${new Date().toISOString().slice(0, 10)}.xlsx`
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        this.exportDialogVisible = false
        this.$message.success('导出成功')
      } catch (error) {
        console.error('导出失败:', error)
        this.$message.error('导出失败：' + (error.message || '网络错误'))
      }
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
        const data = response.data || {}
        const successCount = data.success_count || 0
        const createCount = data.create_count || 0
        const updateCount = data.update_count || 0
        const errorCount = data.error_count || 0
        const errors = data.errors || []
        const totalRows = data.total_rows || 0

        // 构建成功信息
        const successHtml = `
          <div style="text-align: center; margin-bottom: 20px;">
            <i class="el-icon-success" style="font-size: 48px; color: #67c23a;"></i>
            <div style="font-size: 16px; margin-top: 15px; color: #67c23a; font-weight: bold;">导入成功</div>
          </div>
          <div style="background: #f5f7fa; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Excel总行数:</span><span style="font-weight: bold;">${totalRows}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>成功导入:</span><span style="color: #67c23a; font-weight: bold;">${successCount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>新增记录:</span><span style="color: #409eff; font-weight: bold;">${createCount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>更新记录:</span><span style="color: #e6a23c; font-weight: bold;">${updateCount}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>失败记录:</span><span style="color: #f56c6c; font-weight: bold;">${errorCount}</span>
            </div>
          </div>
        `

        // 如果有错误，显示错误列表
        let errorsHtml = ''
        if (errors.length > 0) {
          errorsHtml = `
            <div style="margin-top: 15px;">
              <div style="color: #f56c6c; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #dcdfe6; padding-bottom: 8px;">
                <i class="el-icon-warning"></i> 导入失败明细 (${errors.length}条)
              </div>
              <div style="max-height: 300px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                  <thead style="position: sticky; top: 0; background: #f5f7fa;">
                    <tr>
                      <th style="border: 1px solid #dcdfe6; padding: 8px; text-align: center; width: 60px;">行号</th>
                      <th style="border: 1px solid #dcdfe6; padding: 8px; text-align: center; width: 100px;">学号</th>
                      <th style="border: 1px solid #dcdfe6; padding: 8px; text-align: center;">错误原因</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${errors.map(err => `
                      <tr>
                        <td style="border: 1px solid #dcdfe6; padding: 8px; text-align: center;">${err.row || '-'}</td>
                        <td style="border: 1px solid #dcdfe6; padding: 8px; text-align: center;">${err.student_no || '-'}</td>
                        <td style="border: 1px solid #dcdfe6; padding: 8px; color: #f56c6c;">${err.error || '未知错误'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `
        }

        // 使用 MessageBox 显示弹窗，需要手动关闭
        this.$msgbox({
          title: '导入结果',
          message: successHtml + errorsHtml,
          dangerouslyUseHTMLString: true,
          showClose: true,
          closeOnClickModal: false,
          closeOnPressEscape: false,
          showCancelButton: false,
          showConfirmButton: true,
          confirmButtonText: '关闭',
          beforeClose: (action, instance, done) => {
            // 关闭弹窗后刷新列表并关闭导入对话框
            this.importDialogVisible = false
            this.getList()
            done()
          }
        })
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

    handleUploadProgress(event, file) {
      // 当上传进度为100%时，显示正在导入的提示
      if (event.percent === 100) {
        this.$message.info('正在导入中，勿重复导入')
      }
    },

    async handleDownloadTemplate() {
      // 使用认证请求下载模板（window.open 不会携带 JWT Token）
      try {
        const response = await this.$http.get('/tuition/excel/template/', {
          responseType: 'blob'
        })
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = '学费信息导入模板.xlsx'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        this.$message.success('模板下载成功')
      } catch (error) {
        this.$message.error('模板下载失败')
        console.error('下载模板失败:', error)
      }
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
