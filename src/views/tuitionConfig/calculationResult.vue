<template>
  <div class="app-container">
    <!-- 计算条件 -->
    <el-card class="filter-container search-header" shadow="never">
      <div slot="header" class="clearfix">
        <span>学费计算</span>
      </div>
      <el-form :inline="true" :model="calcForm" class="demo-form-inline">
        <el-form-item label="选择学期：">
          <el-select v-model="calcForm.semester_config_id" placeholder="请选择学期" style="width: 320px;">
            <el-option
              v-for="item in semesterOptions"
              :key="item.id"
              :label="item.name + ' (' + item.total_working_days + '个工作日)' + (item.is_current ? ' [当前学期]' : '')"
              :value="item.id"
            />
          </el-select>
          <span v-if="currentSemesterConfig" class="form-tip" style="color: #67c23a;">
            当前学期: {{ currentSemesterConfig.name }}
          </span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-s-claim" @click="handleCalculateAll">计算所有家庭</el-button>
          <el-button type="success" icon="el-icon-message" @click="handleSendBatchEmailClick">批量发送邮件</el-button>
          <el-button type="warning" icon="el-icon-download" :loading="downloadAllLoading" @click="handleDownloadAllPdfs">一键下载所有PDF</el-button>
          <el-button type="info" icon="el-icon-document" @click="handleManualPdfDialog">手动生成PDF</el-button>
          <el-button icon="el-icon-refresh" @click="refreshCache">刷新</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 家庭选择 -->
    <el-card class="filter-container search-header2" shadow="never" style="margin-top: 15px;">
      <div slot="header" class="clearfix">
        <span>选择家庭</span>
      </div>
      <el-form :inline="true" class="demo-form-inline">
        <el-form-item label="家庭支付方式：">
          <el-select v-model="paymentTypeFilter" placeholder="全部家庭" clearable style="width: 180px;" @change="handlePaymentFilterChange">
            <el-option label="全部家庭" value="" />
            <el-option label="全部全年支付" value="all_yearly">
              <span style="float: left">全部全年支付</span>
              <span v-if="familyPaymentStats.all_yearly_count > 0" style="float: right; color: #8492a6; font-size: 13px">{{ familyPaymentStats.all_yearly_count }}个家庭</span>
            </el-option>
            <el-option label="全部学期支付" value="all_semester">
              <span style="float: left">全部学期支付</span>
              <span v-if="familyPaymentStats.all_semester_count > 0" style="float: right; color: #8492a6; font-size: 13px">{{ familyPaymentStats.all_semester_count }}个家庭</span>
            </el-option>
            <el-option label="混合支付" value="mixed">
              <span style="float: left">混合支付</span>
              <span v-if="familyPaymentStats.mixed_count > 0" style="float: right; color: #8492a6; font-size: 13px">{{ familyPaymentStats.mixed_count }}个家庭</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="家庭编号：">
          <el-select v-model="selectedFamily" placeholder="请选择家庭" clearable filterable style="width: 200px;">
            <el-option
              v-for="item in filteredFamilyOptions"
              :key="item.invoice_no || item"
              :label="item.invoice_no || item"
              :value="item.invoice_no || item"
            >
              <span style="float: left">{{ item.invoice_no || item }}</span>
              <span v-if="item.payment_type" style="float: right; color: #8492a6; font-size: 13px">
                <el-tag v-if="item.payment_type === 'all_yearly'" type="success" size="mini">全年</el-tag>
                <el-tag v-else-if="item.payment_type === 'all_semester'" type="warning" size="mini">学期</el-tag>
                <el-tag v-else type="info" size="mini">混合</el-tag>
                {{ item.yearly_count }}/{{ item.semester_count }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleCalculateFamily">计算选中家庭</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 计算结果 -->
    <el-card v-if="calculationResult" class="result-container" shadow="never" style="margin-top: 15px; max-height: calc(100vh - 350px); overflow-y: auto;">
      <div slot="header" class="clearfix">
        <span>计算结果</span>
        <el-button style="float: right; padding: 3px 0" type="text" @click="handleExportResult">导出结果</el-button>
      </div>

      <div v-if="calculationResult.families">
        <el-descriptions :column="3" border style="margin-bottom: 20px;">
          <el-descriptions-item label="学期">{{ calculationResult.semester_config?.name || '当前学期' }}</el-descriptions-item>
          <el-descriptions-item label="家庭数量">{{ calculationResult.family_count }}</el-descriptions-item>
          <el-descriptions-item label="学生总数">{{ calculationResult.total_students }}</el-descriptions-item>
          <el-descriptions-item label="学期日期" :span="2">{{ calculationResult.semester_config?.start_date }} 至 {{ calculationResult.semester_config?.end_date }}</el-descriptions-item>
          <el-descriptions-item label="总金额">
            <span class="amount-text" style="font-size: 16px;">¥{{ calculationResult.total_amount }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <el-collapse v-model="activeNames">
          <el-collapse-item v-for="(family, index) in calculationResult.families" :key="index" :name="index">
            <template slot="title">
              <div style="width: 100%; display: flex; justify-content: space-between; padding-right: 20px;">
                <span>
                  <i class="el-icon-house" style="margin-right: 10px;" />
                  家庭：{{ family.invoice_no }}
                  <el-tag size="small" style="margin-left: 10px;">{{ family.student_count }}名学生</el-tag>
                </span>
                <span class="amount-text">¥{{ family.final_total }}</span>
              </div>
            </template>

            <el-table :data="family.students" border style="width: 100%; margin-bottom: 15px;">
              <el-table-column label="学生姓名" prop="student_name" align="center" />
              <el-table-column label="年级" prop="grade" align="center" />
              <el-table-column label="支付方式" align="center" width="80">
                <template slot-scope="scope">
                  <el-tag v-if="scope.row.payment_type === 'yearly'" type="success" size="mini">全年</el-tag>
                  <el-tag v-else type="warning" size="mini">学期</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="基础学费" align="center">
                <template slot-scope="scope">
                  ¥{{ scope.row.base_tuition }}
                </template>
              </el-table-column>
              <el-table-column label="学期信息" align="center" width="120">
                <template slot-scope="scope">
                  <div v-if="scope.row.payment_type === 'semester' && scope.row.semester_rate">
                    <div>费率: {{ scope.row.semester_rate }}%</div>
                    <div v-if="scope.row.enrollment_date" style="font-size: 11px; color: #999;">
                      入学: {{ scope.row.enrollment_date }}
                    </div>
                  </div>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="注册费" align="center" width="80">
                <template slot-scope="scope">
                  ¥{{ scope.row.registration_fee }}
                </template>
              </el-table-column>
              <el-table-column label="兄弟姐妹折扣" align="center" width="120">
                <template slot-scope="scope">
                  <span v-if="scope.row.sibling_discount_amount > 0" class="discount-text">
                    -¥{{ scope.row.sibling_discount_amount }}
                  </span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="教师折扣" align="center" width="100">
                <template slot-scope="scope">
                  <span v-if="scope.row.teacher_discount_amount > 0" class="discount-text">
                    -¥{{ scope.row.teacher_discount_amount }}
                  </span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="最终学费" align="center" width="100">
                <template slot-scope="scope">
                  <span class="amount-text">¥{{ scope.row.final_tuition }}</span>
                </template>
              </el-table-column>
            </el-table>

            <el-descriptions :column="3" border>
              <el-descriptions-item label="学费小计">¥{{ family.family_tuition_subtotal }}</el-descriptions-item>
              <el-descriptions-item label="公司折扣">
                <span v-if="family.family_discounts.company_discount_amount > 0" class="discount-text">
                  -¥{{ family.family_discounts.company_discount_amount }}
                </span>
                <span v-else>-</span>
              </el-descriptions-item>
              <el-descriptions-item label="校友折扣">
                <span v-if="family.family_discounts.alumni_discount_amount > 0" class="discount-text">
                  -¥{{ family.family_discounts.alumni_discount_amount }}
                </span>
                <span v-else>-</span>
              </el-descriptions-item>
              <el-descriptions-item label="校车费用">¥{{ family.bus_fee }}</el-descriptions-item>
              <el-descriptions-item label="应付总额" :span="2">
                <span class="amount-text" style="font-size: 16px;">¥{{ family.final_total }}</span>
              </el-descriptions-item>
            </el-descriptions>

            <div style="margin-top: 15px; text-align: right;">
              <el-button type="primary" size="small" icon="el-icon-view" @click="handlePreviewPDF(family)">预览PDF</el-button>
              <el-button type="success" size="small" icon="el-icon-message" @click="handleSendEmailClick(family)">发送邮件</el-button>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>

      <div v-else-if="calculationResult.invoice_no">
        <el-descriptions :column="3" border style="margin-bottom: 20px;">
          <el-descriptions-item label="家庭编号">{{ calculationResult.invoice_no }}</el-descriptions-item>
          <el-descriptions-item label="学生数量">{{ calculationResult.student_count }}</el-descriptions-item>
          <el-descriptions-item label="应付总额">
            <span class="amount-text" style="font-size: 16px;">¥{{ calculationResult.final_total }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="学期">{{ calculationResult.semester_config?.name || '当前学期' }}</el-descriptions-item>
          <el-descriptions-item label="学期日期" :span="2">{{ calculationResult.semester_config?.start_date }} 至 {{ calculationResult.semester_config?.end_date }}</el-descriptions-item>
        </el-descriptions>

        <el-table :data="calculationResult.students" border style="width: 100%; margin-bottom: 15px;">
          <el-table-column label="学生姓名" prop="student_name" align="center" />
          <el-table-column label="年级" prop="grade" align="center" />
          <el-table-column label="支付方式" align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.payment_type === 'yearly'" type="success">全年</el-tag>
              <el-tag v-else type="warning">学期</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="基础学费" align="center">
            <template slot-scope="scope">
              ¥{{ scope.row.base_tuition }}
            </template>
          </el-table-column>
          <el-table-column label="学期信息" align="center" width="150">
            <template slot-scope="scope">
              <div v-if="scope.row.payment_type === 'semester' && scope.row.semester_rate">
                <div>费率: {{ scope.row.semester_rate }}%</div>
                <div v-if="scope.row.enrollment_date" style="font-size: 12px; color: #999;">
                  入学: {{ scope.row.enrollment_date }}
                </div>
              </div>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="注册费" align="center">
            <template slot-scope="scope">
              ¥{{ scope.row.registration_fee }}
            </template>
          </el-table-column>
          <el-table-column label="兄弟姐妹折扣" align="center">
            <template slot-scope="scope">
              <span v-if="scope.row.sibling_discount_amount > 0" class="discount-text">
                -¥{{ scope.row.sibling_discount_amount }}
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="最终学费" align="center">
            <template slot-scope="scope">
              <span class="amount-text">¥{{ scope.row.final_tuition }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div style="text-align: right;">
          <el-button type="primary" icon="el-icon-view" @click="handlePreviewPDF(calculationResult)">预览PDF</el-button>
          <el-button type="success" icon="el-icon-message" @click="handleSendEmailClick(calculationResult)">发送邮件</el-button>
        </div>
      </div>
    </el-card>

    <!-- PDF预览对话框 -->
    <el-dialog title="学费通知单预览" :visible.sync="pdfDialogVisible" width="800px" @close="handlePdfDialogClose">
      <div v-if="pdfUrl" style="text-align: center;">
        <iframe 
          :src="pdfUrl" 
          width="100%" 
          height="600px" 
          style="border: none;"
          @load="handlePdfLoad"
        ></iframe>
      </div>
      <div v-else style="text-align: center; padding: 50px;">
        <i class="el-icon-loading" style="font-size: 24px;"></i>
        <p>正在加载PDF...</p>
      </div>
    </el-dialog>

    <!-- 发送邮件对话框 -->
    <el-dialog title="发送学费通知邮件" :visible.sync="emailDialogVisible" width="600px">
      <el-form label-width="100px">
        <el-form-item label="家庭编号">
          <span>{{ currentEmailFamily?.invoice_no }}</span>
        </el-form-item>
        <el-form-item label="应付总额">
          <span class="amount-text">¥{{ currentEmailFamily?.final_total }}</span>
        </el-form-item>
        <el-form-item label="附加邮件">
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
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <div slot="tip" class="el-upload__tip">支持PDF、Word、Excel、图片等格式，单文件不超过10MB</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="emailDialogVisible = false">取消</el-button>
        <el-button type="success" :loading="emailSending" @click="submitSendEmail">发送邮件</el-button>
      </div>
    </el-dialog>

    <!-- 批量发送邮件对话框 -->
    <el-dialog title="批量发送学费通知邮件" :visible.sync="batchEmailDialogVisible" width="600px">
      <el-form label-width="100px">
        <el-form-item label="发送范围">
          <el-tag type="info">所有已计算的家庭</el-tag>
        </el-form-item>
        <el-form-item label="附加邮件">
          <el-upload
            ref="batchEmailAttachmentUpload"
            action="#"
            :auto-upload="false"
            :on-change="handleBatchEmailAttachmentChange"
            :on-remove="handleBatchEmailAttachmentRemove"
            :file-list="batchEmailAttachmentList"
            multiple
            drag
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <div slot="tip" class="el-upload__tip">支持PDF、Word、Excel、图片等格式，单文件不超过10MB。所有附件将随每封邮件一起发送。</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="batchEmailDialogVisible = false">取消</el-button>
        <el-button type="success" :loading="batchEmailSending" @click="submitBatchSendEmail">批量发送</el-button>
      </div>
    </el-dialog>

    <!-- 手动生成PDF对话框 -->
    <el-dialog title="手动生成学费PDF" :visible.sync="manualPdfDialogVisible" width="900px" :close-on-click-modal="false">
      <el-form ref="manualPdfForm" :model="manualPdfForm" :rules="manualPdfRules" label-width="140px">
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发票编号" prop="invoice_no">
              <el-input v-model="manualPdfForm.invoice_no" placeholder="如：XLIS 2026-2027 0184" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="家庭名称" prop="family_name">
              <el-input v-model="manualPdfForm.family_name" placeholder="如：Zhang Family" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学年" prop="academic_year">
              <el-input v-model="manualPdfForm.academic_year" placeholder="如：2026-2027" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="付款截止日期">
              <el-date-picker v-model="manualPdfForm.due_date" type="date" placeholder="选择日期" value-format="yyyy-MM-dd" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学年开始日期">
              <el-date-picker v-model="manualPdfForm.start_date" type="date" placeholder="选择日期" value-format="yyyy-MM-dd" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学年结束日期">
              <el-date-picker v-model="manualPdfForm.end_date" type="date" placeholder="选择日期" value-format="yyyy-MM-dd" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="包含校车费">
              <el-switch v-model="manualPdfForm.include_bus" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="校车费金额">
              <el-input-number v-model="manualPdfForm.bus_fee" :min="0" :precision="2" style="width: 100%;" :disabled="!manualPdfForm.include_bus" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">学生信息</el-divider>
        <div v-for="(student, index) in manualPdfForm.students" :key="index" class="student-section">
          <el-card shadow="never" style="margin-bottom: 15px;">
            <div slot="header" class="clearfix">
              <span>学生 {{ index + 1 }}</span>
              <el-button v-if="manualPdfForm.students.length > 1" style="float: right; padding: 3px 0; color: #f56c6c;" type="text" @click="removeStudent(index)">删除</el-button>
            </div>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="英文名" :prop="'students.' + index + '.english_name'" :rules="{ required: true, message: '请输入英文名', trigger: 'blur' }">
                  <el-input v-model="student.english_name" placeholder="英文名" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="学号" :prop="'students.' + index + '.student_no'" :rules="{ required: true, message: '请输入学号', trigger: 'blur' }">
                  <el-input v-model="student.student_no" placeholder="学号" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="班级" :prop="'students.' + index + '.class_name'" :rules="{ required: true, message: '请输入班级', trigger: 'blur' }">
                  <el-input v-model="student.class_name" placeholder="如：M3B" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="基础学费" :prop="'students.' + index + '.base_tuition'" :rules="{ required: true, message: '请输入基础学费', trigger: 'blur' }">
                  <el-input-number v-model="student.base_tuition" :min="0" :precision="2" style="width: 100%;" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-divider content-position="left">折扣信息（可选）</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="兄弟姐妹折扣率(%)">
                  <el-input-number v-model="student.sibling_discount_rate" :min="0" :max="100" :precision="2" style="width: 100%;" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="兄弟姐妹折扣额">
                  <el-input-number v-model="student.sibling_discount_amount" :min="0" :precision="2" style="width: 100%;" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="校友折扣率(%)">
                  <el-input-number v-model="student.alumni_discount_rate" :min="0" :max="100" :precision="2" style="width: 100%;" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="校友折扣额">
                  <el-input-number v-model="student.alumni_discount_amount" :min="0" :precision="2" style="width: 100%;" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="公司折扣率(%)">
                  <el-input-number v-model="student.company_discount_rate" :min="0" :max="100" :precision="2" style="width: 100%;" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="公司折扣额">
                  <el-input-number v-model="student.company_discount_amount" :min="0" :precision="2" style="width: 100%;" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="教师子弟">
                  <el-switch v-model="student.is_teacher_child" active-text="是" inactive-text="否" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="教师折扣率(%)">
                  <el-input-number v-model="student.teacher_discount_rate" :min="0" :max="100" :precision="2" style="width: 100%;" :disabled="!student.is_teacher_child" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="教师折扣额">
                  <el-input-number v-model="student.teacher_discount_amount" :min="0" :precision="2" style="width: 100%;" :disabled="!student.is_teacher_child" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="需要校车">
                  <el-switch v-model="student.needs_school_bus" active-text="是" inactive-text="否" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-divider content-position="left">奖学金（可选）</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="奖学金折扣率(%)">
                  <el-input-number v-model="student.scholarship_discount_rate" :min="0" :max="100" :precision="2" style="width: 100%;" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="奖学金折扣额">
                  <el-input-number v-model="student.scholarship_discount_amount" :min="0" :precision="2" style="width: 100%;" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="奖学金固定金额">
                  <el-input-number v-model="student.scholarship_amount" :min="0" :precision="2" style="width: 100%;" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-card>
        </div>
        <el-button type="primary" icon="el-icon-plus" style="width: 100%; margin-bottom: 20px;" @click="addStudent">添加学生</el-button>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="manualPdfDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="manualPdfLoading" @click="handleGenerateManualPdf">生成PDF</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'TuitionCalculation',
  data() {
    return {
      calcForm: {
        academic_year: '2025-2026',
        semester_config_id: null  // null 表示使用当前学期（启用的配置）
      },
      selectedFamily: '',
      familyOptions: [],
      familyPaymentOptions: {
        all_yearly: [],
        all_semester: [],
        mixed: []
      },
      familyPaymentStats: {
        all_yearly_count: 0,
        all_semester_count: 0,
        mixed_count: 0,
        total: 0
      },
      paymentTypeFilter: '',
      semesterOptions: [],
      currentSemesterConfig: null,  // 当前启用的学期配置
      calculationResult: null,
      activeNames: [0],
      pdfDialogVisible: false,
      pdfUrl: '',
      downloadAllLoading: false,
      emailDialogVisible: false,
      batchEmailDialogVisible: false,
      emailSending: false,
      batchEmailSending: false,
      currentEmailFamily: null,
      emailAttachmentList: [],
      batchEmailAttachmentList: [],
      manualPdfDialogVisible: false,
      manualPdfLoading: false,
      manualPdfForm: {
        invoice_no: '',
        family_name: '',
        academic_year: '2026-2027',
        due_date: '',
        start_date: '',
        end_date: '',
        include_bus: true,
        bus_fee: 11000,
        students: [{
          english_name: '',
          student_no: '',
          class_name: '',
          base_tuition: 165000,
          sibling_discount_rate: 0,
          sibling_discount_amount: 0,
          company_discount_rate: 0,
          company_discount_amount: 0,
          alumni_discount_rate: 0,
          alumni_discount_amount: 0,
          is_teacher_child: false,
          teacher_discount_rate: 0,
          teacher_discount_amount: 0,
          needs_school_bus: true,
          scholarship_discount_rate: 0,
          scholarship_discount_amount: 0,
          scholarship_amount: 0
        }]
      },
      manualPdfRules: {
        invoice_no: [{ required: true, message: '请输入发票编号', trigger: 'blur' }],
        family_name: [{ required: true, message: '请输入家庭名称', trigger: 'blur' }],
        academic_year: [{ required: true, message: '请输入学年', trigger: 'blur' }]
      }
    }
  },
  computed: {
    filteredFamilyOptions() {
      // 如果有支付方式筛选，返回对应的家庭列表
      if (this.paymentTypeFilter && this.familyPaymentOptions[this.paymentTypeFilter]) {
        return this.familyPaymentOptions[this.paymentTypeFilter]
      }
      // 否则直接返回家庭选项列表
      return this.familyOptions
    }
  },
  created() {
    // 并行加载基础数据
    this.initPageData()
  },
  methods: {
    // 初始化页面数据（并行加载）
    async initPageData() {
      console.log('开始加载学费计算页面数据...')
      const startTime = Date.now()
      
      // 并行加载基础数据
      await Promise.all([
        this.getFamilyOptions(),
        this.getSemesterOptions(),
        this.getFamilyPaymentTypes()
      ])
      
      const endTime = Date.now()
      console.log(`学费计算页面数据加载完成，耗时: ${endTime - startTime}ms`)
    },
    
    // 刷新数据
    async refreshCache() {
      this.$message.info('正在刷新数据...')
      await this.initPageData()
      this.$message.success('数据已刷新')
    },
    
    // 获取所有学费信息中的家庭编号（已废弃，保留方法避免引用错误）
    async getExistingFamilyNumbers() {
      // 不再从 studenttuitioninfo 获取数据进行去重
      // 直接返回空集合，不再过滤家庭列表
      return new Set()
    },
    
    async getFamilyOptions() {
      try {
        const res = await this.$http.get('/tuition/calculate/', { params: { type: 'families' }})
        let allFamilies = res.data || []
        console.log('后端返回的所有家庭:', allFamilies)
        
        // 直接使用后端返回的家庭列表（已去重）
        this.familyOptions = allFamilies
        console.log('有效家庭数量:', allFamilies.length)
        
        if (allFamilies.length === 0) {
          this.$message.warning('没有可计算的家庭，请先在学生学费信息管理中维护家庭数据')
        }
      } catch (error) {
        console.error('获取家庭列表失败:', error)
        this.familyOptions = []
      }
    },
    
    async getFamilyPaymentTypes() {
      try {
        const res = await this.$http.get('/tuition/calculate/', { params: { type: 'family_payment_types' }})
        
        if (res.data && res.data.families) {
          // 直接使用后端返回的家庭列表，不再根据学费信息过滤
          this.familyPaymentOptions = {
            all_yearly: res.data.families.all_yearly || [],
            all_semester: res.data.families.all_semester || [],
            mixed: res.data.families.mixed || []
          }
          
          this.familyPaymentStats = {
            all_yearly_count: this.familyPaymentOptions.all_yearly.length,
            all_semester_count: this.familyPaymentOptions.all_semester.length,
            mixed_count: this.familyPaymentOptions.mixed.length,
            total: this.familyPaymentOptions.all_yearly.length + 
                   this.familyPaymentOptions.all_semester.length + 
                   this.familyPaymentOptions.mixed.length
          }
        }
      } catch (error) {
        console.error('获取家庭支付方式筛选失败:', error)
      }
    },
    handlePaymentFilterChange(value) {
      // 当选择支付方式筛选时，重置选中的家庭
      this.selectedFamily = ''
      if (value && this.familyPaymentOptions[value] && this.familyPaymentOptions[value].length > 0) {
        this.$message.success(`已筛选出 ${this.familyPaymentOptions[value].length} 个${this.getPaymentTypeLabel(value)}的家庭`)
      }
    },
    getPaymentTypeLabel(type) {
      const labels = {
        'all_yearly': '全部全年支付',
        'all_semester': '全部学期支付',
        'mixed': '混合支付'
      }
      return labels[type] || type
    },
    async getSemesterOptions() {
      try {
        // 获取所有启用的学期配置，不过滤 is_active，因为当前学期可能不是启用的
        const res = await this.$http.get('/semesterconfig/', { params: { ordering: '-academic_year,semester_number' }})
        let results = []
        if (Array.isArray(res)) {
          results = res
        } else if (res.results) {
          results = res.results
        } else if (res.data) {
          results = Array.isArray(res.data) ? res.data : [res.data]
        }
        this.semesterOptions = results
        
        // 找出当前学期配置（is_current=true）
        const currentConfig = results.find(item => item.is_current)
        if (currentConfig) {
          this.currentSemesterConfig = currentConfig
          // 默认选中当前学期
          this.calcForm.semester_config_id = currentConfig.id
          console.log('当前学期配置:', currentConfig.name)
        } else if (results.length > 0) {
          // 如果没有标记为当前学期的，使用第一个启用的
          const activeConfig = results.find(item => item.is_active)
          if (activeConfig) {
            this.currentSemesterConfig = activeConfig
            this.calcForm.semester_config_id = activeConfig.id
            console.log('使用第一个启用的学期配置:', activeConfig.name)
          }
        }
      } catch (error) {
        console.error('获取学期列表失败:', error)
        this.semesterOptions = []
      }
    },
    async handleCalculateAll() {
      try {
        const params = {
          action: 'calculate_all',
          academic_year: this.calcForm.academic_year
        }
        
        // 使用选中的学期配置ID（默认是当前学期）
        if (this.calcForm.semester_config_id) {
          params.semester_config_id = this.calcForm.semester_config_id
          console.log('使用学期配置ID:', this.calcForm.semester_config_id)
        } else if (this.currentSemesterConfig) {
          // 如果没有选中且存在当前学期配置，使用当前学期
          params.semester_config_id = this.currentSemesterConfig.id
          console.log('使用当前学期配置:', this.currentSemesterConfig.name)
        }
        
        const res = await this.$http.post('/tuition/calculate/', params)
        this.calculationResult = res.data
        
        // 如果后端返回的学期配置不是当前学期，显示提示
        if (this.calculationResult.semester_config && 
            this.currentSemesterConfig && 
            this.calculationResult.semester_config.id !== this.currentSemesterConfig.id) {
          this.$message.info('使用的是非当前学期的配置')
        }
        
        this.$message.success('计算完成')
      } catch (error) {
        this.$message.error('计算失败')
      }
    },
    async handleCalculateFamily() {
      if (!this.selectedFamily) {
        this.$message.warning('请选择家庭')
        return
      }
      try {
        const params = {
          action: 'calculate_family',
          invoice_no: this.selectedFamily,
          academic_year: this.calcForm.academic_year
        }
        
        // 使用选中的学期配置ID（默认是当前学期）
        if (this.calcForm.semester_config_id) {
          params.semester_config_id = this.calcForm.semester_config_id
          console.log('使用学期配置ID:', this.calcForm.semester_config_id)
        } else if (this.currentSemesterConfig) {
          // 如果没有选中且存在当前学期配置，使用当前学期
          params.semester_config_id = this.currentSemesterConfig.id
          console.log('使用当前学期配置:', this.currentSemesterConfig.name)
        }
        
        const res = await this.$http.post('/tuition/calculate/', params)
        this.calculationResult = res.data
        
        // 如果后端返回的学期配置不是当前学期，显示提示
        if (this.calculationResult.semester_config && 
            this.currentSemesterConfig && 
            this.calculationResult.semester_config.id !== this.currentSemesterConfig.id) {
          this.$message.info('使用的是非当前学期的配置')
        }
        
        this.$message.success('计算完成')
      } catch (error) {
        this.$message.error('计算失败')
      }
    },
    handleReset() {
      this.selectedFamily = ''
      this.paymentTypeFilter = ''
      this.calculationResult = null
    },
    // 打开发送邮件对话框
    handleSendEmailClick(family) {
      this.currentEmailFamily = family
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
      if (!this.currentEmailFamily) {
        this.$message.error('未选择家庭')
        return
      }

      try {
        this.emailSending = true
        this.$message.info('正在发送邮件...')

        // 构建FormData
        const formData = new FormData()
        formData.append('action', 'send_single')
        formData.append('invoice_no', this.currentEmailFamily.invoice_no)

        // 添加附件
        this.emailAttachmentList.forEach(file => {
          formData.append('attachments', file.raw)
        })

        await this.$http.post('/tuition/email/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        this.$message.success('邮件发送成功')
        this.emailDialogVisible = false
        this.emailAttachmentList = []
      } catch (error) {
        console.error('邮件发送失败:', error)
        this.$message.error('邮件发送失败：' + (error.message || '网络错误'))
      } finally {
        this.emailSending = false
      }
    },

    // 打开批量发送邮件对话框
    handleSendBatchEmail() {
      this.batchEmailAttachmentList = []
      this.batchEmailDialogVisible = true
    },

    // 处理批量邮件附件选择
    handleBatchEmailAttachmentChange(file, fileList) {
      this.batchEmailAttachmentList = fileList
    },

    // 处理批量邮件附件移除
    handleBatchEmailAttachmentRemove(file, fileList) {
      this.batchEmailAttachmentList = fileList
    },

    // 提交批量发送邮件（带附件）
    async submitBatchSendEmail() {
      try {
        this.batchEmailSending = true
        this.$message.info('正在批量发送邮件...')

        // 构建FormData
        const formData = new FormData()
        formData.append('action', 'send_batch')

        // 添加附件
        this.batchEmailAttachmentList.forEach(file => {
          formData.append('attachments', file.raw)
        })

        const res = await this.$http.post('/tuition/email/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        const data = res.data || res
        this.$message.success(data.message || '批量邮件发送成功')
        this.batchEmailDialogVisible = false
        this.batchEmailAttachmentList = []
      } catch (error) {
        console.error('批量邮件发送失败:', error)
        this.$message.error('批量邮件发送失败：' + (error.message || '网络错误'))
      } finally {
        this.batchEmailSending = false
      }
    },
    async handlePreviewPDF(family) {
      try {
        const res = await this.$http.post('/tuition/email/', {
          action: 'preview_pdf',
          invoice_no: family.invoice_no
        }, { responseType: 'blob' })
        // http拦截器返回的是整个response对象，需要取data
        const blob = res.data || res
        this.pdfUrl = URL.createObjectURL(blob)
        this.pdfDialogVisible = true
      } catch (error) {
        this.$message.error('PDF预览失败: ' + (error.message || '未知错误'))
      }
    },
    handleExportResult() {
      this.$message.info('导出功能开发中...')
    },
    handlePdfDialogClose() {
      // 释放 blob URL，防止内存泄漏
      if (this.pdfUrl && this.pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.pdfUrl)
        this.pdfUrl = ''
      }
    },
    handlePdfLoad() {
      console.log('PDF加载成功')
    },

    // 打开手动生成PDF对话框
    handleManualPdfDialog() {
      this.manualPdfDialogVisible = true
      // 重置表单
      this.manualPdfForm = {
        invoice_no: '',
        family_name: '',
        academic_year: '2026-2027',
        due_date: '',
        start_date: '',
        end_date: '',
        include_bus: true,
        bus_fee: 11000,
        students: [{
          english_name: '',
          student_no: '',
          class_name: '',
          base_tuition: 165000,
          sibling_discount_rate: 0,
          sibling_discount_amount: 0,
          company_discount_rate: 0,
          company_discount_amount: 0,
          alumni_discount_rate: 0,
          alumni_discount_amount: 0,
          is_teacher_child: false,
          teacher_discount_rate: 0,
          teacher_discount_amount: 0,
          needs_school_bus: true,
          scholarship_discount_rate: 0,
          scholarship_discount_amount: 0,
          scholarship_amount: 0
        }]
      }
    },

    // 添加学生
    addStudent() {
      this.manualPdfForm.students.push({
        english_name: '',
        student_no: '',
        class_name: '',
        base_tuition: 165000,
        sibling_discount_rate: 0,
        sibling_discount_amount: 0,
        company_discount_rate: 0,
        company_discount_amount: 0,
        alumni_discount_rate: 0,
        alumni_discount_amount: 0,
        is_teacher_child: false,
        teacher_discount_rate: 0,
        teacher_discount_amount: 0,
        needs_school_bus: true,
        scholarship_discount_rate: 0,
        scholarship_discount_amount: 0,
        scholarship_amount: 0
      })
    },

    // 删除学生
    removeStudent(index) {
      this.manualPdfForm.students.splice(index, 1)
    },

    // 生成手动PDF
    async handleGenerateManualPdf() {
      this.$refs.manualPdfForm.validate(async(valid) => {
        if (!valid) {
          this.$message.error('请填写必填字段')
          return
        }

        // 验证学生信息
        for (let i = 0; i < this.manualPdfForm.students.length; i++) {
          const s = this.manualPdfForm.students[i]
          if (!s.english_name || !s.student_no || !s.class_name || !s.base_tuition) {
            this.$message.error(`学生 ${i + 1} 信息不完整`)
            return
          }
        }

        try {
          this.manualPdfLoading = true
          this.$message.info('正在生成PDF...')

          // 构建请求数据
          const requestData = {
            ...this.manualPdfForm,
            bus_fee: this.manualPdfForm.include_bus ? this.manualPdfForm.bus_fee : 0
          }

          const response = await this.$http.post('/tuition/email/', {
            action: 'generate_manual_pdf',
            ...requestData
          }, {
            responseType: 'blob'
          })

          // 获取文件名
          const contentDisposition = response.headers['content-disposition']
          let filename = 'manual_tuition.pdf'
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/)
            if (filenameMatch) {
              filename = filenameMatch[1]
            }
          }

          // 下载PDF
          const blob = new Blob([response.data], { type: 'application/pdf' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)

          this.$message.success('PDF生成成功')
          this.manualPdfDialogVisible = false
        } catch (error) {
          console.error('生成PDF失败:', error)
          this.$message.error('PDF生成失败：' + (error.message || '网络错误'))
        } finally {
          this.manualPdfLoading = false
        }
      })
    },

    // 一键下载所有PDF
    async handleDownloadAllPdfs() {
      try {
        await this.$confirm('即将下载所有家庭的学费PDF文件，打包成zip格式。根据数据量大小，可能需要一些时间，请耐心等待。', '确认下载', {
          confirmButtonText: '确认下载',
          cancelButtonText: '取消',
          type: 'info'
        })

        this.downloadAllLoading = true
        this.$message.info('正在生成PDF文件，请稍候...')

        // 发送请求，设置responseType为blob以接收文件流
        const response = await this.$http.post('/tuition/email/', {
          action: 'download_all_pdfs'
        }, {
          responseType: 'blob'
        })

        // 从响应头获取文件名
        const contentDisposition = response.headers['content-disposition']
        let filename = 'All_Tuition_Invoices.zip'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }

        // 获取生成统计信息
        const generatedCount = response.headers['x-generated-count'] || 0
        const failedCount = response.headers['x-failed-count'] || 0

        // 创建下载链接
        const blob = new Blob([response.data], { type: 'application/zip' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        // 显示成功消息
        let msg = `下载成功，共生成 ${generatedCount} 个PDF文件`
        if (parseInt(failedCount) > 0) {
          msg += `，${failedCount} 个失败`
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
    }
  }
}
</script>

<style lang="scss" scoped>
.amount-text {
  color: #f56c6c;
  font-weight: bold;
}
.discount-text {
  color: #67c23a;
}
.form-tip {
  margin-left: 5px;
  color: #999;
  font-size: 12px;
}
.filter-container {
  margin-bottom: 15px;
}
</style>
