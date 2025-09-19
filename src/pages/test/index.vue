<!-- 测试页面 -->
<!-- 一个上传按钮 -->
<template>
  <div class="p-4">
    <Button variant="default" class="flex items-center gap-2" @click="uploadFile">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
      上传文件
    </Button>
  </div>
</template>

<script setup>
import { ref } from "vue";

const encryptedData = ref('')
const key = ref("XAEhg51aKKSMHgFUSQJr6hEkWv5gCYJ8j7kfQixCV8c=");

function uploadFile() {
  // 获取文件后进行解密
  const file = document.createElement("input");
  file.type = "file";
  file.accept = ".pdf";
  file.click();

  file.onchange = async (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async () => {
      try {
        // 将 ArrayBuffer 转换为 Uint8Array
        const arrayBuffer = reader.result;
        const encryptedBytes = new Uint8Array(arrayBuffer);

        // 从加密数据中提取IV(前16字节)和密文
        const iv = encryptedBytes.slice(0, 16);
        const ciphertext = encryptedBytes.slice(16);

        // 将IV和密文转换为Base64格式的字符串
        const ivBase64 = arrayBufferToBase64(iv.buffer);
        const ciphertextBase64 = arrayBufferToBase64(ciphertext.buffer);

        // 使用CryptoJS解密
        const decrypted = await decryptFile(ciphertextBase64, key.value, ivBase64);

        // 保存解密后的数据
        const decryptedFile = new File([decrypted], "decrypted.pdf", { type: "application/pdf" });
        const url = URL.createObjectURL(decryptedFile);
        const a = document.createElement("a");
        a.href = url;
        a.download = "decrypted.pdf";
        a.click();
      }
      catch (error) {
        console.error("解密失败:", error);
        // alert('文件解密失败: ' + error.message)
      }
    };
  };
}

// ArrayBuffer转Base64
function arrayBufferToBase64(buffer) {
  const binary = [];
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary.push(String.fromCharCode(bytes[i]));
  }
  return btoa(binary.join(""));
}

// Base64转ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// 解密文件
async function decryptFile(ciphertextBase64, keyBase64, ivBase64) {
  // 将密钥和IV转换为WordArray格式
  const keyWordArray = CryptoJS.enc.Base64.parse(keyBase64);
  const ivWordArray = CryptoJS.enc.Base64.parse(ivBase64);

  // 解密
  const decrypted = CryptoJS.AES.decrypt(
    ciphertextBase64,
    keyWordArray,
    {
      iv: ivWordArray,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC,
    },
  );

  // 转换为ArrayBuffer
  const decryptedStr = decrypted.toString(CryptoJS.enc.Base64);
  return new Uint8Array(base64ToArrayBuffer(decryptedStr));
}
</script>

<route lang="yaml">
  meta:
    layout: blank
</route>
