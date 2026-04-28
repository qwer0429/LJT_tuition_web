<template>
  <div class="app-container">
    <!-- 计算条件 -->
    <el-card class="filter-container search-header" shadow="never">
      <div slot="header" class="clearfix">
        <span>学费单制作</span>
      </div>
      <el-form :inline="true" :model="calcForm" class="demo-form-inline">
        <el-form-item label="邮件主题：">
          <el-input v-model="emailSubject" placeholder="请输入邮件主题" style="width: 280px;" />
        </el-form-item>
        <el-form-item label="计算方式：">
          <el-select v-model="calcForm.payment_type" placeholder="请选择计算方式" style="width: 120px;" @change="handlePaymentTypeChange">
            <el-option label="学年" value="yearly" />
            <el-option label="学期" value="semester" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="calcForm.payment_type === 'semester'" label="学期选择：">
          <el-select v-model="calcForm.semester_id" placeholder="请选择学期" style="width: 320px;">
            <el-option
              v-for="item in semesterOptions"
              :key="item.id"
              :label="item.name + ' (' + (item.total_teaching_days || 0) + '个到校日)' + (item.is_active ? ' [启用]' : '')"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <el-form :inline="true" class="demo-form-inline" style="margin-top: 10px;">
        <el-form-item>
          <el-button type="primary" icon="el-icon-s-claim" :loading="calculateLoading" @click="handleCalculateAll">制作所有学费单</el-button>
          <el-button type="success" icon="el-icon-message" :disabled="!calculationResult || !calculationResult.families || calculationResult.families.length === 0" @click="handleSendBatchEmail">批量发送邮件</el-button>
          <el-button type="warning" icon="el-icon-download" :loading="downloadAllLoading" @click="handleDownloadAllPdfs">一键下载所有PDF</el-button>
          <el-button type="warning" icon="el-icon-download" :loading="downloadSelectedLoading" :disabled="selectedFamilies.length === 0" @click="handleDownloadSelectedPdfs">下载选中({{ selectedFamilies.length }})</el-button>
          <el-button type="info" icon="el-icon-document" @click="handleManualPdfDialog">手动制作学费单</el-button>
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
        <el-form-item label="家庭编号：">
          <el-select
            v-model="selectedFamilyList"
            placeholder="请选择家庭（可多选）"
            clearable
            filterable
            multiple
            collapse-tags
            style="width: 320px;"
          >
            <el-option
              v-for="item in familyOptions"
              :key="item.invoice_no || item"
              :label="item.invoice_no || item"
              :value="item.invoice_no || item"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" :loading="calculateLoading" :disabled="selectedFamilyList.length === 0" @click="handleCalculateFamily">制作选中学费单({{ selectedFamilyList.length }})</el-button>
          <el-button type="success" icon="el-icon-message" :disabled="selectedFamilyList.length === 0" @click="handleSendBatchEmailFromList">发送选中({{ selectedFamilyList.length }})</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 制作结果 -->
    <el-card v-if="calculationResult" class="result-container" shadow="never" style="margin-top: 15px; max-height: calc(100vh - 350px); overflow-y: auto;">
      <div slot="header" class="clearfix">
        <span>制作结果</span>
        <el-button style="float: right; padding: 3px 0" type="text" @click="handleExportResult">导出结果</el-button>
      </div>

      <div v-if="calculationResult.families">
        <el-descriptions :column="3" border style="margin-bottom: 20px;">
          <el-descriptions-item :label="calcForm.payment_type === 'yearly' ? '学年' : '学期'">{{ calcForm.payment_type === 'yearly' ? (calculationResult.semester_config?.academic_year || calculationResult.semester_config?.name?.split(' ')[0] || '当前学年') : (calculationResult.semester_config?.name || '当前学期') }}</el-descriptions-item>
          <el-descriptions-item label="家庭数量">{{ calculationResult.family_count }}</el-descriptions-item>
          <el-descriptions-item label="学生总数">{{ calculationResult.total_students }}</el-descriptions-item>
          <el-descriptions-item :label="calcForm.payment_type === 'yearly' ? '学年日期' : '学期日期'" :span="2">{{ calculationResult.semester_config?.start_date }} 至 {{ calculationResult.semester_config?.end_date }}</el-descriptions-item>
          <el-descriptions-item label="总到校日">{{ calculationResult.semester_config?.total_working_days || '-' }} 天</el-descriptions-item>
          <el-descriptions-item label="总金额">
            <span class="amount-text" style="font-size: 16px;">¥{{ calculationResult.total_amount }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <div style="margin-bottom: 10px; display: flex; align-items: center; gap: 15px;">
          <el-checkbox v-model="isSelectAll" @change="handleSelectAll">全选</el-checkbox>
          <el-button v-if="selectedFamilies.length > 0" type="text" size="small" style="color: #f56c6c;" @click="handleClearSelection">清空选择({{ selectedFamilies.length }})</el-button>
        </div>
        <el-collapse v-model="activeNames">
          <el-collapse-item v-for="(family, index) in calculationResult.families" :key="index" :name="index">
            <template slot="title">
              <div style="width: 100%; display: flex; justify-content: space-between; padding-right: 20px; align-items: center;">
                <span style="display: flex; align-items: center;">
                  <el-checkbox v-model="family.isSelected" style="margin-right: 10px;" @change="handleFamilySelect(family, index)" @click.native.stop />
                  <i class="el-icon-house" style="margin-right: 10px;" />
                  家庭：{{ family.invoice_no }}
                  <el-tag size="small" style="margin-left: 10px;">{{ family.student_count }}名学生</el-tag>
                </span>
                <span style="display: flex; align-items: center; gap: 10px;">
                  <el-button type="text" size="small" icon="el-icon-download" @click.stop="handleDownloadSinglePdf(family)">下载PDF</el-button>
                  <span class="amount-text">¥{{ family.final_total }}</span>
                </span>
              </div>
            </template>

            <el-table :data="family.students" border style="width: 100%; margin-bottom: 15px;">
              <el-table-column label="学生姓名" prop="student_name" align="center" />
              <el-table-column label="年级" prop="grade" align="center" />
              <el-table-column label="支付方式" align="center" width="80">
                <template slot-scope="scope">
                  <el-tag v-if="scope.row.payment_type === 'yearly'" type="success" size="mini">学年</el-tag>
                  <el-tag v-else type="warning" size="mini">学期</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="基础学费" align="center">
                <template slot-scope="scope">
                  ¥{{ scope.row.base_tuition }}
                </template>
              </el-table-column>
              <el-table-column label="到校日" align="center" width="100">
                <template slot-scope="scope">
                  <span v-if="scope.row.student_working_days">{{ scope.row.student_working_days }} 天</span>
                  <span v-else-if="scope.row.semester_config?.total_working_days">{{ scope.row.semester_config.total_working_days }} 天</span>
                  <span v-else>-</span>
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
          <el-descriptions-item :label="calcForm.payment_type === 'yearly' ? '学年' : '学期'">{{ calcForm.payment_type === 'yearly' ? (calculationResult.semester_config?.academic_year || calculationResult.semester_config?.name?.split(' ')[0] || '当前学年') : (calculationResult.semester_config?.name || '当前学期') }}</el-descriptions-item>
          <el-descriptions-item :label="calcForm.payment_type === 'yearly' ? '学年日期' : '学期日期'" :span="2">{{ calculationResult.semester_config?.start_date }} 至 {{ calculationResult.semester_config?.end_date }}</el-descriptions-item>
          <el-descriptions-item label="总到校日">{{ calculationResult.semester_config?.total_working_days || '-' }} 天</el-descriptions-item>
        </el-descriptions>

        <el-table :data="calculationResult.students" border style="width: 100%; margin-bottom: 15px;">
          <el-table-column label="学生姓名" prop="student_name" align="center" />
          <el-table-column label="年级" prop="grade" align="center" />
          <el-table-column label="到校日" align="center" width="100">
            <template slot-scope="scope">
              <span v-if="scope.row.student_working_days">{{ scope.row.student_working_days }} 天</span>
              <span v-else-if="scope.row.semester_config?.total_working_days">{{ scope.row.semester_config.total_working_days }} 天</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="支付方式" align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.payment_type === 'yearly'" type="success">学年</el-tag>
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

    <!-- 制作结果（空状态） -->
    <el-card v-else class="result-container" shadow="never" style="margin-top: 15px;">
      <div style="text-align: center; padding: 40px 0; color: #909399;">
        <i class="el-icon-s-claim" style="font-size: 48px; margin-bottom: 15px; display: block;" />
        <p style="font-size: 14px;">请先选择计算方式并点击"制作所有学费单"按钮</p>
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
        />
      </div>
      <div v-else style="text-align: center; padding: 50px;">
        <i class="el-icon-loading" style="font-size: 24px;" />
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
            <i class="el-icon-upload" />
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

    <!-- 批量发送邮件对话框（所有家庭） -->
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
            <i class="el-icon-upload" />
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

    <!-- 发送选中家庭对话框 -->
    <el-dialog title="发送选中家庭的学费邮件" :visible.sync="selectedBatchEmailDialogVisible" width="600px">
      <el-form label-width="100px">
        <el-form-item label="发送范围">
          <el-tag type="warning">已选中的 {{ selectedFamilies.length }} 个家庭</el-tag>
        </el-form-item>
        <el-form-item label="选中家庭">
          <div style="max-height: 150px; overflow-y: auto; border: 1px solid #dcdfe6; border-radius: 4px; padding: 10px;">
            <el-tag v-for="family in selectedFamilies" :key="family.invoice_no" size="small" style="margin: 2px;">
              {{ family.invoice_no }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="附加附件">
          <el-upload
            ref="selectedBatchEmailAttachmentUpload"
            action="#"
            :auto-upload="false"
            :on-change="handleSelectedBatchEmailAttachmentChange"
            :on-remove="handleSelectedBatchEmailAttachmentRemove"
            :file-list="selectedBatchEmailAttachmentList"
            multiple
            drag
          >
            <i class="el-icon-upload" />
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <div slot="tip" class="el-upload__tip">支持PDF、Word、Excel、图片等格式，单文件不超过10MB。所有附件将随每封邮件一起发送。</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="selectedBatchEmailDialogVisible = false">取消</el-button>
        <el-button type="success" :loading="selectedBatchEmailSending" @click="submitSelectedBatchSendEmail">发送选中</el-button>
      </div>
    </el-dialog>

    <!-- 手动制作学费单对话框 -->
    <el-dialog title="手动制作学费单" :visible.sync="manualPdfDialogVisible" width="950px" :close-on-click-modal="false">
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
            <el-form-item label="是否统计该学费单">
              <el-switch v-model="manualPdfForm.include_in_statistics" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计算方式">
              <el-radio-group v-model="manualPdfForm.calculation_type" @change="handleCalculationTypeChange">
                <el-radio-button label="yearly">全年</el-radio-button>
                <el-radio-button label="semester_1">第一学期</el-radio-button>
                <el-radio-button label="semester_2">第二学期</el-radio-button>
              </el-radio-group>
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

        <el-row v-if="manualPdfForm.calculation_type === 'semester_1' || manualPdfForm.calculation_type === 'semester_2'" :gutter="20" style="margin-bottom: 10px;">
          <el-col :span="24" style="text-align: right;">
            <el-button type="primary" size="small" icon="el-icon-date" :loading="manualPdfLoading" @click="calculateCustomWorkingDays">
              计算工作天数与折算学费
            </el-button>
            <span style="color: #909399; font-size: 12px; margin-left: 10px;">
              根据就读日期范围计算实际到校日
            </span>
          </el-col>
        </el-row>
        <el-divider content-position="left">学生信息</el-divider>
        <div v-for="(student, index) in manualPdfForm.students" :key="index" class="student-section">
          <el-card shadow="never" style="margin-bottom: 15px;">
            <div slot="header" class="clearfix">
              <span>学生 {{ index + 1 }}</span>
              <el-select
                v-model="student._selectedTuitionId"
                filterable
                clearable
                placeholder="从学费信息中选择学生"
                size="mini"
                style="width: 220px; margin-left: 10px;"
                @change="val => fillStudentFromTuitionInfo(index, val)"
              >
                <el-option
                  v-for="opt in studentTuitionOptions"
                  :key="opt.id"
                  :label="`${opt.student_name || opt.student_no_xf} (${opt.grade || '无年级'})`"
                  :value="opt.id"
                />
              </el-select>
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
                <el-form-item label="年级" :prop="'students.' + index + '.grade'" :rules="{ required: true, message: '请输入年级', trigger: 'blur' }">
                  <el-input v-model="student.grade" placeholder="如：M3B" @blur="handleGradeBlur(index, student)" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="基础学费" :prop="'students.' + index + '.base_tuition'" :rules="{ required: true, message: '请输入基础学费', trigger: 'blur' }">
                  <el-input-number v-model="student.base_tuition" :min="0" :precision="2" style="width: 100%;" @change="calculateStudentDiscounts(index)" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="注册费">
                  <el-input-number v-model="student.registration_fee" :min="0" :precision="2" style="width: 100%;" @change="calculateStudentDiscounts(index)" />
                </el-form-item>
              </el-col>
            </el-row>
            <!-- 学期支付：学生个人就读日期 -->
            <el-row v-if="manualPdfForm.calculation_type === 'semester_1' || manualPdfForm.calculation_type === 'semester_2'" :gutter="20">
              <el-col :span="12">
                <el-form-item label="就读开始日期">
                  <el-date-picker v-model="student.custom_start_date" type="date" placeholder="默认使用学期开始日期" value-format="yyyy-MM-dd" style="width: 100%;" @change="calculateStudentDiscounts(index)" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="就读结束日期">
                  <el-date-picker v-model="student.custom_end_date" type="date" placeholder="默认使用学期结束日期" value-format="yyyy-MM-dd" style="width: 100%;" @change="calculateStudentDiscounts(index)" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row v-if="(manualPdfForm.calculation_type === 'semester_1' || manualPdfForm.calculation_type === 'semester_2') && student.working_days !== null" :gutter="20">
              <el-col :span="12">
                <el-form-item label="到校日">
                  <div style="line-height: 36px; color: #409EFF; font-weight: bold;">
                    {{ student.working_days }} / {{ student.total_working_days }} 天
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="折算后学费">
                  <div style="line-height: 36px; color: #67C23A; font-weight: bold;">
                    ¥{{ formatMoney(student.prorated_tuition || student.base_tuition) }}
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-divider content-position="left">
              折扣信息（可选）
              <el-button type="text" size="mini" @click="calculateStudentDiscounts(index)">
                <i class="el-icon-refresh" /> 自动计算折扣金额
              </el-button>
            </el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="家庭折扣率(%)" label-width="120px">
                  <el-input-number v-model="student.sibling_discount_rate" :min="0" :max="100" :precision="2" style="width: 100%;" @change="calculateStudentDiscounts(index)" />
                  <el-tooltip content="输入值为百分比，如5表示5%，实际计算时自动转换为0.05" placement="top">
                    <i class="el-icon-question" style="color: #909399; margin-left: 8px; cursor: pointer;" />
                  </el-tooltip>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="家庭折扣额" label-width="120px">
                  <el-input-number v-model="student.sibling_discount_amount" :min="0" :precision="2" style="width: 100%;" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="校友折扣率(%)">
                  <el-input-number v-model="student.alumni_discount_rate" :min="0" :max="100" :precision="2" style="width: 100%;" @change="calculateStudentDiscounts(index)" />
                  <el-tooltip content="输入值为百分比，如5表示5%，实际计算时自动转换为0.05" placement="top">
                    <i class="el-icon-question" style="color: #909399; margin-left: 8px; cursor: pointer;" />
                  </el-tooltip>
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
                  <el-input-number v-model="student.company_discount_rate" :min="0" :max="100" :precision="2" style="width: 100%;" @change="calculateStudentDiscounts(index)" />
                  <el-tooltip content="输入值为百分比，如5表示5%，实际计算时自动转换为0.05" placement="top">
                    <i class="el-icon-question" style="color: #909399; margin-left: 8px; cursor: pointer;" />
                  </el-tooltip>
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
                  <el-switch v-model="student.is_teacher_child" active-text="是" inactive-text="否" @change="calculateStudentDiscounts(index)" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="教师折扣率(%)">
                  <el-input-number v-model="student.teacher_discount_rate" :min="0" :max="100" :precision="2" style="width: 100%;" :disabled="!student.is_teacher_child" @change="calculateStudentDiscounts(index)" />
                  <el-tooltip content="输入值为百分比，如5表示5%，实际计算时自动转换为0.05" placement="top">
                    <i class="el-icon-question" style="color: #909399; margin-left: 8px; cursor: pointer;" />
                  </el-tooltip>
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
            <el-divider content-position="left">奖学金设置</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="奖学金类型">
                  <el-select v-model="student.scholarship_type" style="width: 100%;" @change="handleScholarshipTypeChange(index)">
                    <el-option label="无" value="none" />
                    <el-option label="定额（学费直接为此金额）" value="fixed" />
                    <el-option label="比例折扣（从学费中扣除）" value="percentage" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <!-- 定额奖学金 -->
            <el-row v-if="student.scholarship_type === 'fixed'" :gutter="20">
              <el-col :span="12">
                <el-form-item label="奖学金定额">
                  <el-input-number v-model="student.scholarship_amount" :min="0" :precision="2" style="width: 100%;" placeholder="学费将等于此金额" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <div style="line-height: 36px; color: #909399; font-size: 12px;">
                  最终学费 = {{ student.scholarship_amount || 0 }} + 注册费
                </div>
              </el-col>
            </el-row>
            <!-- 比例奖学金 -->
            <el-row v-if="student.scholarship_type === 'percentage'" :gutter="20">
              <el-col :span="12">
                <el-form-item label="奖学金折扣率(%)">
                  <el-input-number v-model="student.scholarship_discount_rate" :min="0" :max="100" :precision="2" style="width: 100%;" @change="calculateStudentDiscounts(index)" />
                  <el-tooltip content="输入值为百分比，如5表示5%，实际计算时自动转换为0.05" placement="top">
                    <i class="el-icon-question" style="color: #909399; margin-left: 8px; cursor: pointer;" />
                  </el-tooltip>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="奖学金折扣额">
                  <el-input-number v-model="student.scholarship_discount_amount" :min="0" :precision="2" style="width: 100%;" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">助学金(Bursary)设置</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="助学金类型">
                  <el-select v-model="student.financial_aid_type" style="width: 100%;" @change="handleFinancialAidTypeChange(index)">
                    <el-option label="无" value="none" />
                    <el-option label="定额（学费直接为此金额）" value="fixed" />
                    <el-option label="比例折扣（从学费中扣除）" value="percentage" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <!-- 定额助学金 -->
            <el-row v-if="student.financial_aid_type === 'fixed'" :gutter="20">
              <el-col :span="12">
                <el-form-item label="助学金定额">
                  <el-input-number v-model="student.financial_aid_amount" :min="0" :precision="2" style="width: 100%;" placeholder="学费将等于此金额" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <div style="line-height: 36px; color: #909399; font-size: 12px;">
                  最终学费 = {{ student.financial_aid_amount || 0 }} + 注册费
                </div>
              </el-col>
            </el-row>
            <!-- 比例助学金 -->
            <el-row v-if="student.financial_aid_type === 'percentage'" :gutter="20">
              <el-col :span="12">
                <el-form-item label="助学金折扣率(%)" label-width="130px">
                  <el-input-number v-model="student.financial_aid_discount_rate" :min="0" :max="100" :precision="2" style="width: 100%;" @change="calculateStudentDiscounts(index)" />
                  <el-tooltip content="输入值为百分比，如5表示5%，实际计算时自动转换为0.05" placement="top">
                    <i class="el-icon-question" style="color: #909399; margin-left: 8px; cursor: pointer;" />
                  </el-tooltip>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="助学金折扣额">
                  <el-input-number v-model="student.financial_aid_discount_amount" :min="0" :precision="2" style="width: 100%;" />
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 金额预览 -->
            <el-divider content-position="left">
              <span style="color: #67C23A;">金额预览</span>
            </el-divider>
            <el-row :gutter="20">
              <el-col :span="24">
                <div class="amount-preview">
                  <div class="preview-item">
                    <span class="label">基础学费:</span>
                    <span class="value">¥{{ formatMoney(student.base_tuition) }}</span>
                  </div>
                  <div v-if="student.scholarship_type !== 'fixed' && getTotalDiscountAmount(student) > 0" class="preview-item discount">
                    <span class="label">总折扣:</span>
                    <span class="value">-¥{{ formatMoney(getTotalDiscountAmount(student)) }}</span>
                  </div>
                  <div v-if="student.scholarship_type === 'fixed'" class="preview-item">
                    <span class="label">奖学金定额:</span>
                    <span class="value">¥{{ formatMoney(student.scholarship_amount) }}</span>
                  </div>
                  <div class="preview-item highlight">
                    <span class="label">最终学费:</span>
                    <span class="value">¥{{ formatMoney(calculateFinalAmount(student)) }}</span>
                    <span class="detail">({{ getCalculationDetail(student) }})</span>
                  </div>
                </div>
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
        academic_year: '2026-2027',
        semester_id: null, // null 表示使用当前学期（启用的配置）
        payment_type: 'yearly' // 'yearly', 'semester'
      },
      emailSubject: '', // 邮件主题，由 getActiveCalculationConfig 动态初始化
      selectedFamilyList: [], // 多选家庭列表
      familyOptions: [],
      semesterOptions: [],
      currentSemesterConfig: null, // 当前启用的学期配置
      calculationResult: null,
      activeNames: [0],
      pdfDialogVisible: false,
      pdfUrl: '',
      downloadAllLoading: false,
      downloadSelectedLoading: false,
      calculateLoading: false,
      selectedFamilies: [], // 选中的家庭列表
      isSelectAll: false, // 是否全选
      emailDialogVisible: false,
      batchEmailDialogVisible: false,
      selectedBatchEmailDialogVisible: false, // 发送选中对话框
      emailSending: false,
      batchEmailSending: false,
      selectedBatchEmailSending: false, // 发送选中加载状态
      currentEmailFamily: null,
      emailAttachmentList: [],
      batchEmailAttachmentList: [],
      selectedBatchEmailAttachmentList: [], // 发送选中附件列表
      emailStatusPolling: null, // 邮件状态轮询定时器
      emailSendingInvoiceNo: null, // 当前正在查询发送状态的invoice_no
      manualPdfDialogVisible: false,
      manualPdfLoading: false,
      studentTuitionOptions: [], // 学费信息中的学生列表（用于手动PDF选择）
      manualPdfForm: {
        invoice_no: '',
        family_name: '',
        academic_year: '2026-2027',
        due_date: '',
        start_date: '',
        end_date: '',
        include_in_statistics: true,
        include_bus: true,
        bus_fee: 11000,
        calculation_type: 'yearly', // 'yearly' | 'semester_1' | 'semester_2'

        students: [{
          _selectedTuitionId: null,
          english_name: '',
          student_no: '',
          grade: '',
          base_tuition: 165000,
          custom_start_date: '',
          custom_end_date: '',
          working_days: null,
          total_working_days: null,
          prorated_tuition: null,

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
          scholarship_type: 'none', // 'none' | 'fixed' | 'percentage'
          scholarship_discount_rate: 0,
          scholarship_discount_amount: 0,
          scholarship_amount: 0,
          financial_aid_type: 'none', // 'none' | 'fixed' | 'percentage'
          financial_aid_discount_rate: 0,
          financial_aid_discount_amount: 0,
          financial_aid: 0
        }]
      },
      manualPdfRules: {
        invoice_no: [{ required: true, message: '请输入发票编号', trigger: 'blur' }],
        family_name: [{ required: true, message: '请输入家庭名称', trigger: 'blur' }],
        academic_year: [{ required: true, message: '请输入学年', trigger: 'blur' }]
      }
    }
  },
  created() {
    // 并行加载基础数据
    this.initPageData()
  },

  beforeDestroy() {
    // 组件销毁时清除邮件状态轮询定时器
    this.stopEmailStatusPolling()
  },
  methods: {
    // 获取实际的 payment_type（处理学期选择）
    getActualPaymentType() {
      if (this.calcForm.payment_type === 'semester') {
        // 根据选中的学期配置确定是第一学期还是第二学期
        const selectedSemester = this.semesterOptions.find(s => s.id === this.calcForm.semester_id)
        if (selectedSemester) {
          // semester 字段值: 'First', 'Second', 'Summer'
          return selectedSemester.semester === 'First' ? 'semester_1' : 'semester_2'
        }
        return 'semester_1'
      }
      return this.calcForm.payment_type
    },

    // 获取支付类型的显示文本
    getPaymentTypeLabel() {
      if (this.calcForm.payment_type === 'semester') {
        const selectedSemester = this.semesterOptions.find(s => s.id === this.calcForm.semester_id)
        if (selectedSemester) {
          // semester 字段值: 'First', 'Second', 'Summer'
          return selectedSemester.semester === 'First' ? '第一学期' : '第二学期'
        }
        return '学期'
      }
      return '学年'
    },

    // 处理计算方式变化
    handlePaymentTypeChange(value) {
      // 切换时保持学期选择不变
    },

    // 验证计算表单
    validateCalcForm() {
      if (!this.calcForm.payment_type) {
        this.$message.warning('请选择计算方式')
        return false
      }

      if (!this.calcForm.semester_id) {
        this.$message.warning('请选择学期')
        return false
      }

      return true
    },

    // 构建计算请求参数
    buildCalcParams(extraParams = {}) {
      const params = {
        academic_year: this.calcForm.academic_year,
        payment_type: this.getActualPaymentType(),
        ...extraParams
      }

      // 使用选中的学期ID（默认是当前学期）
      if (this.calcForm.semester_id) {
        params.semester_id = this.calcForm.semester_id
      } else if (this.currentSemesterConfig) {
        params.semester_id = this.currentSemesterConfig.id
      }

      return params
    },

    // 初始化页面数据
    async initPageData() {
      console.log('开始加载学费计算页面数据...')
      const startTime = Date.now()

      // 1. 先获取计算规则配置中的启用学年
      await this.getActiveCalculationConfig()
      // 2. 再加载学期选项
      await this.getSemesterOptions()
      // 3. 最后按启用学年加载家庭列表
      await this.getFamilyOptions()

      const endTime = Date.now()
      console.log(`学费计算页面数据加载完成，耗时: ${endTime - startTime}ms`)
    },

    // 获取当前启用的计算规则配置学年
    async getActiveCalculationConfig() {
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

        const activeConfig = configs.find(c => c.is_active)
        if (activeConfig && activeConfig.academic_year) {
          this.calcForm.academic_year = activeConfig.academic_year
          this.emailSubject = activeConfig.academic_year + ' tuition sheet'
          console.log('从计算规则获取启用学年:', activeConfig.academic_year)
        } else {
          this.emailSubject = this.calcForm.academic_year + ' tuition sheet'
          console.warn('未找到启用的计算规则配置，使用默认学年:', this.calcForm.academic_year)
        }
      } catch (error) {
        console.error('获取计算规则配置失败:', error)
      }
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
        const params = { type: 'families' }
        // 如果有当前学年，按学年过滤家庭列表
        if (this.calcForm.academic_year) {
          params.academic_year = this.calcForm.academic_year
        }
        const res = await this.$http.get('/tuition/calculate/', { params })
        const allFamilies = res.data || []
        console.log(`后端返回的 ${this.calcForm.academic_year || '全部'} 学年家庭:`, allFamilies)

        // 直接使用后端返回的家庭列表（已去重并按学年过滤）
        this.familyOptions = allFamilies
        console.log('有效家庭数量:', allFamilies.length)

        if (allFamilies.length === 0) {
          this.$message.warning(`学年 ${this.calcForm.academic_year} 没有可计算的家庭，请先在学生学费信息管理中维护家庭数据`)
        }
      } catch (error) {
        console.error('获取家庭列表失败:', error)
        this.familyOptions = []
      }
    },

    async getSemesterOptions() {
      try {
        // 获取所有启用的学期
        const res = await this.$http.get('/semester/', { params: { ordering: '-academic_year,semester' }})
        let results = []
        if (Array.isArray(res)) {
          results = res
        } else if (res.results) {
          results = res.results
        } else if (res.data) {
          results = Array.isArray(res.data) ? res.data : [res.data]
        }

        // 过滤：只显示与当前计算规则学年一致的学期
        if (this.calcForm.academic_year) {
          results = results.filter(item => item.academic_year === this.calcForm.academic_year)
          console.log(`学期已按学年过滤: ${this.calcForm.academic_year}, 剩余 ${results.length} 个学期`)
        }

        this.semesterOptions = results

        // 使用过滤后第一个启用的学期作为当前学期
        if (results.length > 0) {
          const activeConfig = results.find(item => item.is_active)
          if (activeConfig) {
            this.currentSemesterConfig = activeConfig
            this.calcForm.semester_id = activeConfig.id
            console.log('使用当前学期:', activeConfig.name)
          } else {
            // 没有启用的学期，默认选第一个
            this.currentSemesterConfig = results[0]
            this.calcForm.semester_id = results[0].id
          }
        } else {
          this.currentSemesterConfig = null
          this.calcForm.semester_id = null
          console.warn(`学年 ${this.calcForm.academic_year} 没有可用的学期配置`)
        }
      } catch (error) {
        console.error('获取学期列表失败:', error)
        this.semesterOptions = []
      }
    },
    async handleCalculateAll() {
      if (!this.validateCalcForm()) return

      this.calculateLoading = true
      try {
        const params = this.buildCalcParams({ action: 'calculate_all', save_record: true })
        console.log('计算所有家庭，参数:', params, '显示:', this.getPaymentTypeLabel())

        const res = await this.$http.post('/tuition/calculate/', params)
        this.calculationResult = res.data

        // 如果后端返回的学期不是当前学期，显示提示
        if (this.calculationResult.semester &&
            this.currentSemesterConfig &&
            this.calculationResult.semester.id !== this.currentSemesterConfig.id) {
          this.$message.info('使用的是非当前学期的配置')
        }

        const msg = res.message || '计算完成'
        this.$message.success(msg)
      } catch (error) {
        this.$message.error('计算失败')
      } finally {
        this.calculateLoading = false
      }
    },
    async handleCalculateFamily() {
      if (this.selectedFamilyList.length === 0) {
        this.$message.warning('请选择家庭')
        return
      }

      if (!this.validateCalcForm()) return

      this.calculateLoading = true
      try {
        // 使用批量计算接口
        const params = this.buildCalcParams({
          action: 'calculate_batch',
          invoice_nos: this.selectedFamilyList,
          save_record: true
        })
        console.log('批量制作学费单，参数:', params)

        const res = await this.$http.post('/tuition/calculate/', params)
        console.log('批量制作响应:', res)

        // 检查响应格式 (res 已经是 response.data)
        if (!res.data) {
          console.error('响应格式错误:', res)
          this.$message.error('响应格式错误')
          return
        }

        // 构建与 calculate_all 兼容的数据结构
        this.calculationResult = {
          family_count: res.data.family_count || 0,
          total_amount: res.data.total_amount || 0,
          families: res.data.families || [],
          payment_type: this.calcForm.payment_type,
          semester_config: this.currentSemesterConfig
        }

        // 如果后端返回的学期配置不是当前学期，显示提示
        if (this.calculationResult.families && this.calculationResult.families.length > 0) {
          const firstFamilySemester = this.calculationResult.families[0].semester_config
          if (firstFamilySemester &&
              this.currentSemesterConfig &&
              firstFamilySemester.id !== this.currentSemesterConfig.id) {
            this.$message.info('使用的是非当前学期的配置')
          }
        }

        // 显示错误信息（如果有）
        if (res.data.errors && res.data.errors.length > 0) {
          const errorCount = res.data.errors.length
          this.$message.warning(`${errorCount} 个家庭制作失败，请检查家庭编号`)
          console.warn('制作失败的家庭:', res.data.errors)
        }

        const msg = res.message || `成功制作 ${res.data.family_count} 个家庭的学费单`
        this.$message.success(msg)
      } catch (error) {
        this.$message.error('制作失败: ' + (error.message || '未知错误'))
        console.error('批量制作失败:', error)
        console.error('错误详情:', error.response?.data || error)
      } finally {
        this.calculateLoading = false
      }
    },
    handleReset() {
      this.selectedFamilyList = []
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
        this.$message.info('邮件发送任务已启动，正在发送...')

        // 构建FormData
        const formData = new FormData()
        formData.append('action', 'send_single')
        formData.append('invoice_no', this.currentEmailFamily.invoice_no)
        formData.append('payment_type', this.getActualPaymentType())
        formData.append('subject', this.emailSubject)

        // 添加附件
        this.emailAttachmentList.forEach(file => {
          formData.append('attachments', file.raw)
        })

        await this.$http.post('/tuition/email/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        // 关闭对话框，开始轮询查询邮件发送状态
        this.emailDialogVisible = false
        this.emailAttachmentList = []
        this.emailSendingInvoiceNo = this.currentEmailFamily.invoice_no
        this.startEmailStatusPolling(this.currentEmailFamily.invoice_no)
      } catch (error) {
        console.error('邮件发送失败:', error)
        const errorMsg = (error.response && error.response.data && error.response.data.error) || error.message || '网络错误'
        this.$message.error('邮件发送失败：' + errorMsg)
      } finally {
        this.emailSending = false
      }
    },

    // 开始邮件状态轮询
    startEmailStatusPolling(invoiceNo) {
      // 清除之前的轮询
      this.stopEmailStatusPolling()

      // 立即查询一次
      this.checkEmailStatus(invoiceNo)

      // 每5秒轮询一次
      this.emailStatusPolling = setInterval(() => {
        this.checkEmailStatus(invoiceNo)
      }, 5000)
    },

    // 停止邮件状态轮询
    stopEmailStatusPolling() {
      if (this.emailStatusPolling) {
        clearInterval(this.emailStatusPolling)
        this.emailStatusPolling = null
      }
      this.emailSendingInvoiceNo = null
    },

    // 查询邮件发送状态
    async checkEmailStatus(invoiceNo) {
      try {
        const response = await this.$http.post('/tuition/email/', {
          action: 'get_email_status',
          invoice_no: invoiceNo
        })

        // 响应拦截器已经返回了 response.data，直接使用 response
        const result = response
        console.log('[邮件状态查询]', result)

        if ((result.code === 1 || result.code === '1') && result.data && result.data.length > 0) {
          const status = result.data[0]
          console.log('[邮件状态]', status)

          if (status.email_sent) {
            // 邮件已成功发送
            this.$notify({
              title: '邮件发送成功',
              dangerouslyUseHTMLString: true,
              message: `<div style="line-height: 1.6;">
                <p><strong>${status.invoice_no || this.emailSendingInvoiceNo}</strong></p>
                <p>发送时间：${status.email_sent_at}</p>
              </div>`,
              type: 'success',
              duration: 5000,
              position: 'bottom-right'
            })
            this.stopEmailStatusPolling()
            this.emailSendingInvoiceNo = null
            // 刷新列表数据
            this.initPageData()
          } else {
            console.log('[邮件状态] 尚未发送成功，继续轮询...')
          }
        } else {
          console.log('[邮件状态查询] 响应格式异常:', result)
        }
      } catch (error) {
        console.error('查询邮件状态失败:', error)
        // 查询失败不停止轮询，继续尝试
      }
    },

    // 打开批量发送邮件对话框（发送所有家庭）
    handleSendBatchEmail() {
      this.batchEmailAttachmentList = []
      this.batchEmailDialogVisible = true
    },

    // 从选择列表打开发送邮件对话框
    handleSendBatchEmailFromList() {
      if (this.selectedFamilyList.length === 0) {
        this.$message.warning('请先选择要发送邮件的家庭')
        return
      }
      // 将选择列表的家庭转换为selectedFamilies格式
      this.selectedFamilies = this.selectedFamilyList.map(invoiceNo => ({
        invoice_no: invoiceNo
      }))
      this.selectedBatchEmailAttachmentList = []
      this.selectedBatchEmailDialogVisible = true
    },

    // 打开发送选中家庭的对话框（结果区域勾选）
    handleSendSelectedBatchEmail() {
      if (this.selectedFamilies.length === 0) {
        this.$message.warning('请先选择要发送邮件的家庭')
        return
      }
      this.selectedBatchEmailAttachmentList = []
      this.selectedBatchEmailDialogVisible = true
    },

    // 处理发送选中附件选择
    handleSelectedBatchEmailAttachmentChange(file, fileList) {
      this.selectedBatchEmailAttachmentList = fileList
    },

    // 处理发送选中附件移除
    handleSelectedBatchEmailAttachmentRemove(file, fileList) {
      this.selectedBatchEmailAttachmentList = fileList
    },

    // 提交发送选中家庭的邮件（带附件）
    async submitSelectedBatchSendEmail() {
      if (this.selectedFamilies.length === 0) {
        this.$message.warning('请先选择要发送邮件的家庭')
        return
      }

      this.selectedBatchEmailSending = true
      try {
        const invoiceNos = this.selectedFamilies.map(f => f.invoice_no)
        this.$message.info('批量邮件发送任务已启动，正在后台发送...')

        // 构建FormData
        const formData = new FormData()
        formData.append('action', 'send_batch')
        formData.append('payment_type', this.getActualPaymentType())
        formData.append('subject', this.emailSubject)
        // 使用 JSON 字符串发送数组，后端更可靠地解析
        formData.append('invoice_nos', JSON.stringify(invoiceNos))

        // 添加附件
        this.selectedBatchEmailAttachmentList.forEach(file => {
          formData.append('attachments', file.raw)
        })

        const data = await this.$http.post('/tuition/email/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        this.$message.success(data.message || `批量邮件发送任务已启动，共提交 ${invoiceNos.length} 个家庭`)

        // 显示发送完成提示
        this.$notify({
          title: '批量发送已启动',
          dangerouslyUseHTMLString: true,
          message: `<div style="line-height: 1.6;">
            <p><strong>已成功提交 ${invoiceNos.length} 个家庭</strong>的邮件发送任务</p>
            <p style="color: #666; margin-top: 5px;">系统将在后台逐步处理，每封邮件间隔0.5秒发送</p>
            <p style="color: #666;">请稍后刷新页面查看发送状态</p>
          </div>`,
          type: 'success',
          duration: 8000,
          position: 'bottom-right'
        })

        // 关闭对话框
        this.selectedBatchEmailDialogVisible = false
        this.selectedBatchEmailAttachmentList = []

        // 清空选择
        this.selectedFamilies = []
        this.isSelectAll = false
        if (this.calculationResult?.families) {
          this.calculationResult.families.forEach((family, index) => {
            this.$set(this.calculationResult.families[index], 'isSelected', false)
          })
        }

        // 刷新列表数据
        this.initPageData()
      } catch (error) {
        console.error('批量邮件发送失败:', error)
        const errorMsg = (error.response && error.response.data && error.response.data.error) || error.message || '网络错误'
        this.$message.error('批量邮件发送失败：' + errorMsg)
      } finally {
        this.selectedBatchEmailSending = false
      }
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
        this.$message.info('批量邮件发送任务已启动，正在后台发送...')

        // 构建FormData
        const formData = new FormData()
        formData.append('action', 'send_batch')
        formData.append('payment_type', this.getActualPaymentType())
        formData.append('subject', this.emailSubject)

        // 添加附件
        this.batchEmailAttachmentList.forEach(file => {
          formData.append('attachments', file.raw)
        })

        const data = await this.$http.post('/tuition/email/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        this.$message.success(data.message || '批量邮件发送任务已启动')

        // 显示发送完成提示
        this.$notify({
          title: '批量发送已启动',
          dangerouslyUseHTMLString: true,
          message: `<div style="line-height: 1.6;">
            <p><strong>所有家庭的邮件发送任务已提交</strong></p>
            <p style="color: #666; margin-top: 5px;">系统将在后台逐步处理，每封邮件间隔0.5秒发送</p>
            <p style="color: #666;">请稍后刷新页面查看发送状态</p>
          </div>`,
          type: 'success',
          duration: 8000,
          position: 'bottom-right'
        })

        this.batchEmailDialogVisible = false
        this.batchEmailAttachmentList = []
        // 刷新列表数据
        this.initPageData()
      } catch (error) {
        console.error('批量邮件发送失败:', error)
        const errorMsg = (error.response && error.response.data && error.response.data.error) || error.message || '网络错误'
        this.$message.error('批量邮件发送失败：' + errorMsg)
      } finally {
        this.batchEmailSending = false
      }
    },
    async handlePreviewPDF(family) {
      try {
        const res = await this.$http.post('/tuition/email/', {
          action: 'preview_pdf',
          invoice_no: family.invoice_no,
          payment_type: this.getActualPaymentType()
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
    async handleManualPdfDialog() {
      this.manualPdfDialogVisible = true
      // 加载学生列表（用于选择）
      await this.loadStudentTuitionOptions()
      // 重置表单
      this.manualPdfForm = {
        invoice_no: '',
        family_name: '',
        academic_year: '2026-2027',
        due_date: '',
        start_date: '',
        end_date: '',
        include_in_statistics: true,
        include_bus: true,
        bus_fee: 11000,
        calculation_type: 'yearly',

        students: [{
          _selectedTuitionId: null,
          english_name: '',
          student_no: '',
          grade: '',
          base_tuition: 165000,
          registration_fee: 2000,
          custom_start_date: '',
          custom_end_date: '',
          working_days: null,
          total_working_days: null,
          prorated_tuition: null,

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
          scholarship_type: 'none',
          scholarship_discount_rate: 0,
          scholarship_discount_amount: 0,
          scholarship_amount: 0,
          financial_aid_type: 'none',
          financial_aid_discount_rate: 0,
          financial_aid_discount_amount: 0,
          financial_aid: 0
        }]
      }
    },

    // 添加学生
    addStudent() {
      const calcType = this.manualPdfForm.calculation_type
      let defaultStart = ''
      let defaultEnd = ''
      let defaultWorkingDays = null
      let defaultTotalDays = null

      // 学期支付时自动填充默认学期起止日期和到校日
      if (calcType === 'semester_1' || calcType === 'semester_2') {
        const semester = this.semesterOptions.find(s =>
          (calcType === 'semester_1' && s.semester === 'First') ||
          (calcType === 'semester_2' && s.semester === 'Second')
        )
        if (semester) {
          defaultStart = semester.start_date || ''
          defaultEnd = semester.end_date || ''
          defaultWorkingDays = semester.total_teaching_days || 0
          defaultTotalDays = semester.total_teaching_days || 0
        }
      }

      this.manualPdfForm.students.push({
        _selectedTuitionId: null,
        english_name: '',
        student_no: '',
        grade: '',
        base_tuition: 165000,
        registration_fee: 2000,
        custom_start_date: defaultStart,
        custom_end_date: defaultEnd,
        working_days: defaultWorkingDays,
        total_working_days: defaultTotalDays,
        prorated_tuition: null,

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
        scholarship_type: 'none',
        scholarship_discount_rate: 0,
        scholarship_discount_amount: 0,
        scholarship_amount: 0,
        financial_aid_type: 'none',
        financial_aid_discount_rate: 0,
        financial_aid_discount_amount: 0,
        financial_aid: 0
      })
    },

    // 删除学生
    removeStudent(index) {
      this.manualPdfForm.students.splice(index, 1)
    },

    // 处理奖学金类型变更
    handleScholarshipTypeChange(index) {
      const student = this.manualPdfForm.students[index]
      // 重置相关字段
      if (student.scholarship_type === 'none') {
        student.scholarship_amount = 0
        student.scholarship_discount_rate = 0
        student.scholarship_discount_amount = 0
      } else if (student.scholarship_type === 'fixed') {
        student.scholarship_discount_rate = 0
        student.scholarship_discount_amount = 0
        // 如果助学金也是定额，提示用户只能二选一
        if (student.financial_aid_type === 'fixed') {
          this.$message.warning('奖学金和助学金不能同时设置为定额，已重置助学金')
          student.financial_aid_type = 'none'
          student.financial_aid = 0
        }
      } else if (student.scholarship_type === 'percentage') {
        student.scholarship_amount = 0
      }
    },

    // 处理助学金类型变更
    handleFinancialAidTypeChange(index) {
      const student = this.manualPdfForm.students[index]
      // 重置相关字段
      if (student.financial_aid_type === 'none') {
        student.financial_aid = 0
        student.financial_aid_discount_rate = 0
        student.financial_aid_discount_amount = 0
      } else if (student.financial_aid_type === 'fixed') {
        student.financial_aid_discount_rate = 0
        student.financial_aid_discount_amount = 0
        // 如果奖学金也是定额，提示用户只能二选一
        if (student.scholarship_type === 'fixed') {
          this.$message.warning('奖学金和助学金不能同时设置为定额，已重置奖学金')
          student.scholarship_type = 'none'
          student.scholarship_amount = 0
        }
      } else if (student.financial_aid_type === 'percentage') {
        student.financial_aid = 0
      }
    },

    // 处理计算方式变更
    handleCalculationTypeChange(type) {
      // 根据计算方式切换默认校车费
      if (type === 'yearly') {
        this.manualPdfForm.bus_fee = 11000
        // 全年支付：清空学期相关日期和工作天数
        this.manualPdfForm.students.forEach(s => {
          s.custom_start_date = ''
          s.custom_end_date = ''
          s.working_days = null
          s.total_working_days = null
          s.prorated_tuition = null
        })
      } else if (type === 'semester_1') {
        this.manualPdfForm.bus_fee = 5900
        // 第一学期：自动填充默认学期起止日期和到校日
        const semester = this.semesterOptions.find(s => s.semester === 'First')
        if (semester && semester.start_date && semester.end_date) {
          this.manualPdfForm.students.forEach(s => {
            s.custom_start_date = semester.start_date
            s.custom_end_date = semester.end_date
            s.working_days = semester.total_teaching_days || 0
            s.total_working_days = semester.total_teaching_days || 0
            s.prorated_tuition = null
            s.bus_fee = null
          })
        }
      } else if (type === 'semester_2') {
        this.manualPdfForm.bus_fee = 5100
        // 第二学期：自动填充默认学期起止日期和到校日
        const semester = this.semesterOptions.find(s => s.semester === 'Second')
        if (semester && semester.start_date && semester.end_date) {
          this.manualPdfForm.students.forEach(s => {
            s.custom_start_date = semester.start_date
            s.custom_end_date = semester.end_date
            s.working_days = semester.total_teaching_days || 0
            s.total_working_days = semester.total_teaching_days || 0
            s.prorated_tuition = null
            s.bus_fee = null
          })
        }
      }
    },

    // 计算学期就读期间工作天数（调用后端）
    async calculateCustomWorkingDays() {
      const calcType = this.manualPdfForm.calculation_type
      if (calcType !== 'semester_1' && calcType !== 'semester_2') return

      // 获取当前学期配置
      const semester = this.semesterOptions.find(s =>
        (calcType === 'semester_1' && s.semester === 'First') ||
        (calcType === 'semester_2' && s.semester === 'Second')
      )
      const semesterStart = semester ? semester.start_date : ''
      const semesterEnd = semester ? semester.end_date : ''
      const semesterTotalDays = semester ? (semester.total_teaching_days || 0) : 0

      if (!semesterStart || !semesterEnd) {
        this.$message.warning('未找到学期配置，请先选择学年')
        return
      }

      this.manualPdfLoading = true
      try {
        for (let i = 0; i < this.manualPdfForm.students.length; i++) {
          const student = this.manualPdfForm.students[i]
          // 使用学生自定义日期，默认使用学期日期
          const start = student.custom_start_date || semesterStart
          const end = student.custom_end_date || semesterEnd

          const res = await this.$http.post('/tuition/calculate/', {
            action: 'calculate_tuition_period_days',
            tuition_period: `${start.replace(/-/g, '.')}-${end.replace(/-/g, '.')}`,
            academic_year: this.manualPdfForm.academic_year,
            registration_fee: student.registration_fee || 0
          })

          // 兼容响应格式：res.code 或 res.data.code
          const responseCode = res.code !== undefined ? res.code : (res.data ? res.data.code : null)
          const responseData = res.data !== undefined ? (res.data.data || res.data) : res

          if (responseCode === 1) {
            const data = responseData
            student.working_days = data.working_days || 0
            // 使用学期总教学日作为分母，确保比例计算准确
            student.total_working_days = semesterTotalDays || data.total_working_days || data.total_days || 0

            // 按到校日比例折算基础学费
            const baseTuition = student.base_tuition || 0
            if (data.is_new_student && data.academic_year_days > 0) {
              // 新生学期计算：基础学费 × 1.1 ÷ 学年总到校日 × 到校日
              student.prorated_tuition = parseFloat(
                (baseTuition * 1.1 / data.academic_year_days * student.working_days).toFixed(2)
              )
              // 新生学期校车费 = 学期固定校车费 ÷ 学期总教学日 × 到校日
              const semesterBusFee = calcType === 'semester_1' ? 5900 : 5100
              student.bus_fee = parseFloat(
                (semesterBusFee / student.total_working_days * student.working_days).toFixed(2)
              )
            } else if (student.working_days > 0 && student.total_working_days > 0) {
              // 普通学生：基础学费 × 到校日 / 学期总到校日
              student.prorated_tuition = parseFloat(
                (baseTuition * student.working_days / student.total_working_days).toFixed(2)
              )
              student.bus_fee = null
            } else {
              student.prorated_tuition = baseTuition
              student.bus_fee = null
            }
          }
        }

        // 更新全局校车费（根据每个学生的计算结果汇总）
        const defaultBusFee = calcType === 'semester_1' ? 5900 : 5100
        let totalBusFee = 0
        this.manualPdfForm.students.forEach(s => {
          if (s.needs_school_bus) {
            totalBusFee += s.bus_fee || defaultBusFee
          }
        })
        this.manualPdfForm.bus_fee = parseFloat(totalBusFee.toFixed(2))

        this.$message.success('工作天数与校车费计算完成')
      } catch (error) {
        console.error('计算工作天数失败:', error)
        this.$message.error('计算工作天数失败')
      } finally {
        this.manualPdfLoading = false
      }
    },

    // 计算学生折扣金额（折上折）
    calculateStudentDiscounts(index) {
      const student = this.manualPdfForm.students[index]
      // 自定义期间使用折算后学费作为计算基数
      const baseTuition = student.prorated_tuition || student.base_tuition || 0
      let currentAmount = baseTuition

      // 折上折计算：每个折扣基于上一次折扣后的金额
      // 计算顺序：家庭折扣 -> 校友折扣 -> 奖学金 -> 助学金 -> 公司折扣

      // 1. 家庭折扣（基于基础学费）
      if (student.sibling_discount_rate > 0) {
        student.sibling_discount_amount = parseFloat((currentAmount * student.sibling_discount_rate / 100).toFixed(2))
        currentAmount -= student.sibling_discount_amount
      }

      // 2. 校友折扣（基于家庭折扣后的金额）
      if (student.alumni_discount_rate > 0) {
        student.alumni_discount_amount = parseFloat((currentAmount * student.alumni_discount_rate / 100).toFixed(2))
        currentAmount -= student.alumni_discount_amount
      }

      // 3. 教师子弟折扣（基于校友折扣后的金额）
      if (student.is_teacher_child && student.teacher_discount_rate > 0) {
        student.teacher_discount_amount = parseFloat((currentAmount * student.teacher_discount_rate / 100).toFixed(2))
        currentAmount -= student.teacher_discount_amount
      }

      // 4. 奖学金折扣（基于教师折扣后的金额）
      if (student.scholarship_type === 'percentage' && student.scholarship_discount_rate > 0) {
        student.scholarship_discount_amount = parseFloat((currentAmount * student.scholarship_discount_rate / 100).toFixed(2))
        currentAmount -= student.scholarship_discount_amount
      }

      // 5. 助学金折扣（基于奖学金折扣后的金额）
      if (student.financial_aid_type === 'percentage' && student.financial_aid_discount_rate > 0) {
        student.financial_aid_discount_amount = parseFloat((currentAmount * student.financial_aid_discount_rate / 100).toFixed(2))
        currentAmount -= student.financial_aid_discount_amount
      }

      // 6. 公司折扣（基于以上所有折扣后的金额，优先级最后）
      if (student.company_discount_rate > 0) {
        student.company_discount_amount = parseFloat((currentAmount * student.company_discount_rate / 100).toFixed(2))
      }
    },

    // 获取总折扣金额
    getTotalDiscountAmount(student) {
      let total = 0
      total += student.sibling_discount_amount || 0
      total += student.company_discount_amount || 0
      total += student.alumni_discount_amount || 0
      total += student.teacher_discount_amount || 0
      if (student.scholarship_type === 'percentage') {
        total += student.scholarship_discount_amount || 0
      }
      if (student.financial_aid_type === 'percentage') {
        total += student.financial_aid_discount_amount || 0
      }
      return total
    },

    // 计算最终金额
    calculateFinalAmount(student) {
      const baseTuition = student.prorated_tuition || student.base_tuition || 0
      const registrationFee = student.registration_fee || 0

      // 优先级：奖学金定额 > 助学金定额 > 比例折扣
      if (student.scholarship_type === 'fixed') {
        // 奖学金定额：学费 = 定额 + 注册费
        return (student.scholarship_amount || 0) + registrationFee
      } else if (student.financial_aid_type === 'fixed') {
        // 助学金定额：学费 = 定额 + 注册费
        return (student.financial_aid || 0) + registrationFee
      } else {
        // 比例折扣或无折扣
        const totalDiscount = this.getTotalDiscountAmount(student)
        return baseTuition - totalDiscount + registrationFee
      }
    },

    // 获取计算详情文本
    getCalculationDetail(student) {
      const registrationFee = student.registration_fee || 0
      const calcBase = student.prorated_tuition || student.base_tuition || 0
      const baseLabel = student.prorated_tuition ? '折算后' : '基础'
      if (student.scholarship_type === 'fixed') {
        return `奖学金定额 ${student.scholarship_amount || 0} + 注册费 ${registrationFee}`
      } else if (student.financial_aid_type === 'fixed') {
        return `助学金定额 ${student.financial_aid || 0} + 注册费 ${registrationFee}`
      } else {
        const totalDiscount = this.getTotalDiscountAmount(student)
        return `${baseLabel} ${calcBase} - 折扣 ${totalDiscount} + 注册费 ${registrationFee}`
      }
    },

    // 年级输入框失去焦点时自动匹配学费配置
    async handleGradeBlur(index, student) {
      const grade = student.grade ? student.grade.trim().toUpperCase() : ''
      if (!grade) return

      const targetStudent = student

      try {
        const res = await this.$http.get('/gradetuitionconfig/', {
          params: {
            search: grade,
            academic_year: this.manualPdfForm.academic_year,
            is_active: true
          }
        })

        let results = []
        if (Array.isArray(res)) {
          results = res
        } else if (res.results) {
          results = res.results
        } else if (res.data) {
          results = Array.isArray(res.data) ? res.data : []
        }

        // 查找匹配的年级配置（优先精确匹配，其次前缀匹配）
        let matched = null
        for (const config of results) {
          const configGrade = (config.grade_name || '').toUpperCase()
          if (configGrade === grade) {
            matched = config
            break
          }
          if (grade.startsWith(configGrade) || configGrade.startsWith(grade)) {
            matched = config
            break
          }
        }

        if (matched) {
          targetStudent.base_tuition = parseFloat(matched.base_tuition) || 165000
          if (matched.registration_fee !== undefined && matched.registration_fee !== null) {
            targetStudent.registration_fee = parseFloat(matched.registration_fee)
          }
          this.$message.success(`已自动匹配年级「${matched.grade_name}」的学费配置`)
        }
      } catch (err) {
        console.error('查询年级学费配置失败:', err)
      }
    },

    // 加载学费信息中的学生列表（用于手动PDF选择）
    async loadStudentTuitionOptions() {
      try {
        const res = await this.$http.get('/studenttuitioninfo/', {
          params: {
            academic_year: this.manualPdfForm.academic_year || '2026-2027',
            lightweight: 1
          }
        })
        let list = []
        if (Array.isArray(res)) {
          list = res
        } else if (res.results) {
          list = res.results
        } else if (res.data && Array.isArray(res.data)) {
          list = res.data
        }
        // 按学生去重（同一个学生可能有多条记录）
        const seen = new Set()
        this.studentTuitionOptions = list.filter(item => {
          const key = item.student_no_xf || item.student_name
          if (!key || seen.has(key)) return false
          seen.add(key)
          return true
        })
      } catch (err) {
        console.error('加载学生列表失败:', err)
        this.studentTuitionOptions = []
      }
    },

    // 从学费信息中选择学生，自动填充表单
    async fillStudentFromTuitionInfo(index, selectedId) {
      if (!selectedId) return
      const selected = this.studentTuitionOptions.find(s => s.id === selectedId)
      if (!selected) return

      const student = this.manualPdfForm.students[index]

      // 基础信息
      student.english_name = selected.student_name || ''
      student.student_no = selected.student_no_xf || ''
      student.grade = selected.grade || ''
      student.registration_fee = parseFloat(selected.registration_fee) || 2000
      student.is_teacher_child = !!selected.is_teacher_child
      student.needs_school_bus = selected.needs_school_bus !== false

      // 折扣率
      student.sibling_discount_rate = parseFloat(selected.discount_sibling) || 0
      student.company_discount_rate = parseFloat(selected.discount_company) || 0
      student.alumni_discount_rate = parseFloat(selected.discount_alumni) || 0
      student.teacher_discount_rate = student.is_teacher_child ? 10 : 0

      // 奖学金
      student.scholarship_amount = parseFloat(selected.scholarship_amount) || 0
      student.scholarship_discount_rate = parseFloat(selected.scholarship_discount_rate) || 0
      if (student.scholarship_amount > 0) {
        student.scholarship_type = 'fixed'
      } else if (student.scholarship_discount_rate > 0) {
        student.scholarship_type = 'percentage'
      } else {
        student.scholarship_type = 'none'
      }

      // 助学金
      student.financial_aid = parseFloat(selected.financial_aid) || 0
      student.financial_aid_discount_rate = parseFloat(selected.financial_aid_discount_rate) || 0
      if (student.financial_aid > 0) {
        student.financial_aid_type = 'fixed'
        student.financial_aid_amount = student.financial_aid
      } else if (student.financial_aid_discount_rate > 0) {
        student.financial_aid_type = 'percentage'
      } else {
        student.financial_aid_type = 'none'
      }

      // 先匹配年级学费配置（获取 base_tuition）
      await this.handleGradeBlur(index, student)

      // 再计算折扣金额
      this.calculateStudentDiscounts(index)

      this.$message.success(`已填充学生「${selected.student_name}」的信息`)
    },

    // 格式化金额
    formatMoney(amount) {
      if (!amount) return '0.00'
      return parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
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
          if (!s.english_name || !s.student_no || !s.grade || !s.base_tuition) {
            this.$message.error(`学生 ${i + 1} 信息不完整`)
            return
          }
        }

        try {
          this.manualPdfLoading = true
          this.$message.info('正在生成PDF...')

          // 为每个学生计算最终学费和分配校车费
          const busStudents = this.manualPdfForm.students.filter(x => x.needs_school_bus)
          const busFeePerStudent = busStudents.length > 0 ? this.manualPdfForm.bus_fee / busStudents.length : 0
          const studentsWithFinal = this.manualPdfForm.students.map(s => ({
            ...s,
            final_tuition: this.calculateFinalAmount(s),
            bus_fee: s.needs_school_bus ? (s.bus_fee || busFeePerStudent) : 0
          }))

          // 构建请求数据
          const requestData = {
            ...this.manualPdfForm,
            students: studentsWithFinal,
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

    // 一键下载所有PDF（直接从学费统计的 tuition_pdf 字段获取）
    async handleDownloadAllPdfs() {
      try {
        await this.$confirm(
          '即将下载所有已保存的学费单PDF文件，打包成zip格式。请耐心等待。',
          '确认下载',
          { confirmButtonText: '确认下载', cancelButtonText: '取消', type: 'info' }
        )

        this.downloadAllLoading = true
        this.$message.info('开始批量下载PDF文件...')

        const academicYear = this.calcForm.academic_year
        const response = await this.$http.get('/tuition-payment/download_pdfs/', {
          params: { academic_year: academicYear },
          responseType: 'blob'
        })

        const filename = `Tuition_PDFs_${academicYear}_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.zip`
        this.downloadBlob(new Blob([response.data], { type: 'application/zip' }), filename)

        this.$message.success('PDF批量下载完成')
      } catch (error) {
        if (error === 'cancel') return
        console.error('下载失败:', error)
        this.$message.error('下载失败：' + (error.message || '网络错误'))
      } finally {
        this.downloadAllLoading = false
      }
    },

    // 处理家庭选择
    handleFamilySelect(family, index) {
      // 使用 Vue.set 确保响应式更新
      this.$set(this.calculationResult.families[index], 'isSelected', family.isSelected)

      if (family.isSelected) {
        if (!this.selectedFamilies.find(f => f.invoice_no === family.invoice_no)) {
          this.selectedFamilies.push(family)
        }
      } else {
        const idx = this.selectedFamilies.findIndex(f => f.invoice_no === family.invoice_no)
        if (idx > -1) {
          this.selectedFamilies.splice(idx, 1)
        }
      }
      this.isSelectAll = this.selectedFamilies.length === (this.calculationResult?.families?.length || 0)
    },

    // 全选/取消全选
    handleSelectAll(val) {
      if (this.calculationResult?.families) {
        this.calculationResult.families.forEach((family, index) => {
          this.$set(this.calculationResult.families[index], 'isSelected', val)
        })
        if (val) {
          this.selectedFamilies = [...this.calculationResult.families]
        } else {
          this.selectedFamilies = []
        }
      }
    },

    // 清空选择
    handleClearSelection() {
      this.selectedFamilies = []
      this.isSelectAll = false
      if (this.calculationResult?.families) {
        this.calculationResult.families.forEach((family, index) => {
          this.$set(this.calculationResult.families[index], 'isSelected', false)
        })
      }
    },

    // 下载Blob文件
    downloadBlob(blob, filename) {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },

    // 从响应头获取文件名
    getFilenameFromResponse(response, defaultName) {
      const contentDisposition = response.headers['content-disposition']
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+?)"?$/)
        if (match) return match[1]
      }
      return defaultName
    },

    // 批量下载PDF的公共方法
    async batchDownloadPdfs(requestData, options = {}) {
      const {
        loadingKey = 'downloadLoading',
        defaultFilename = 'Tuition_Batch',
        onProgress = null,
        onComplete = null
      } = options

      const batchSize = 50
      let batchIndex = 0
      let totalBatches = null
      let totalGenerated = 0
      let totalFailed = 0

      if (loadingKey && this[loadingKey] !== undefined) {
        this[loadingKey] = true
      }

      try {
        do {
          const response = await this.$http.post('/tuition/email/', {
            action: 'download_all_pdfs',
            batch_size: batchSize,
            batch_index: batchIndex,
            payment_type: this.getActualPaymentType(),
            ...requestData
          }, { responseType: 'blob' })

          totalBatches = parseInt(response.headers['x-total-batches'] || 1)
          const generatedCount = parseInt(response.headers['x-generated-count'] || 0)
          const failedCount = parseInt(response.headers['x-failed-count'] || 0)

          totalGenerated += generatedCount
          totalFailed += failedCount

          const filename = this.getFilenameFromResponse(
            response,
            `${defaultFilename}_${batchIndex + 1}_of_${totalBatches}.zip`
          )

          this.downloadBlob(new Blob([response.data], { type: 'application/zip' }), filename)

          if (onProgress) {
            onProgress(batchIndex + 1, totalBatches, generatedCount)
          } else {
            this.$message.success(`第 ${batchIndex + 1}/${totalBatches} 批下载完成，本批生成 ${generatedCount} 个PDF`)
          }

          batchIndex++

          if (batchIndex < totalBatches) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } while (batchIndex < totalBatches)

        if (onComplete) {
          onComplete(totalGenerated, totalFailed)
        }

        return { totalGenerated, totalFailed }
      } finally {
        if (loadingKey && this[loadingKey] !== undefined) {
          this[loadingKey] = false
        }
      }
    },

    // 下载单个家庭PDF
    async handleDownloadSinglePdf(family) {
      try {
        this.$message.info(`正在生成 ${family.invoice_no} 的PDF文件...`)

        const response = await this.$http.post('/tuition/email/', {
          action: 'download_all_pdfs',
          invoice_nos: [family.invoice_no],
          batch_size: 1,
          batch_index: 0,
          payment_type: this.getActualPaymentType()
        }, { responseType: 'blob' })

        const filename = this.getFilenameFromResponse(response, `${family.invoice_no}.zip`)
        this.downloadBlob(new Blob([response.data], { type: 'application/zip' }), filename)

        this.$message.success(`${family.invoice_no} PDF下载成功`)
      } catch (error) {
        console.error('下载失败:', error)
        this.$message.error('下载失败：' + (error.message || '网络错误'))
      }
    },

    // 下载选中家庭的PDF
    async handleDownloadSelectedPdfs() {
      if (this.selectedFamilies.length === 0) {
        this.$message.warning('请先选择要下载的家庭')
        return
      }

      try {
        await this.$confirm(
          `即将下载选中的 ${this.selectedFamilies.length} 个家庭的PDF文件，打包成zip格式。请稍候...`,
          '确认下载',
          { confirmButtonText: '确认下载', cancelButtonText: '取消', type: 'info' }
        )

        const invoiceNos = this.selectedFamilies.map(f => f.invoice_no)

        await this.batchDownloadPdfs(
          { invoice_nos: invoiceNos },
          {
            loadingKey: 'downloadSelectedLoading',
            defaultFilename: 'Tuition_Selected_Batch',
            onComplete: (totalGenerated, totalFailed) => {
              let msg = `选中家庭下载完成！总共生成 ${totalGenerated} 个PDF文件`
              if (totalFailed > 0) msg += `，${totalFailed} 个失败`
              this.$message.success(msg)
              this.handleClearSelection()
            }
          }
        )
      } catch (error) {
        if (error === 'cancel') return
        console.error('下载失败:', error)
        this.$message.error('下载失败：' + (error.message || '网络错误'))
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

/* 手动PDF金额预览样式 */
.amount-preview {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 15px;
  margin-top: 10px;
}

.amount-preview .preview-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.amount-preview .preview-item:last-child {
  margin-bottom: 0;
}

.amount-preview .preview-item .label {
  width: 100px;
  color: #606266;
}

.amount-preview .preview-item .value {
  font-weight: 500;
  color: #303133;
}

.amount-preview .preview-item.discount .value {
  color: #f56c6c;
}

.amount-preview .preview-item.highlight {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #dcdfe6;
}

.amount-preview .preview-item.highlight .label {
  font-weight: bold;
  color: #67c23a;
}

.amount-preview .preview-item.highlight .value {
  font-size: 18px;
  font-weight: bold;
  color: #67c23a;
}

.amount-preview .preview-item .detail {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

/* 学生卡片样式 */
.student-section {
  position: relative;
}

.student-section .el-card__header {
  background: #f5f7fa;
  padding: 10px 15px;
}

/* 避免页面底部出现大量空白 */
.app-container {
  min-height: auto;
}
</style>
