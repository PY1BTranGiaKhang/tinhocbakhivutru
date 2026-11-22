const APP_CONFIG = {
  // Dán URL Firebase Realtime Database của bạn vào giữa dấu ngoặc kép (nếu có)
  DEFAULT_FIREBASE_URL: "",

  // Mật khẩu mở tab Quản lý của Giáo viên
  TEACHER_PASSWORD: "123456",

  // API máy chủ biên dịch code thật (Piston)
  PISTON_EXECUTE_URL: "https://emkc.org"
};

const LANG_CONFIG = {
  cpp: { language: "c++", version: "10.2.0", file: "main.cpp" },
  python: { language: "python", version: "3.10.0", file: "main.py" },
  java: { language: "java", version: "15.0.2", file: "Main.java" },
  pascal: { language: "pascal", version: "3.2.2", file: "main.pas" }
};

const CODE_TEMPLATES = {
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết code C++ tại đây\n    \n    return 0;\n}`,
  python: `# Viết code Python tại đây\n`,
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String... args) {\n        Scanner sc = new Scanner(System.in);\n        \n    }\n}`,
  pascal: `program BaiTap;\nbegin\n    { Viết code Pascal tại đây }\nend.`
};

const DEFAULT_PROBLEMS = Array.of(
  {
    id: "B01",
    title: "Tổng hai số nguyên",
    diff: 100,
    tag: "nhập xuất cơ bản",
    desc: "Cho hai số nguyên a và b. Hãy tính và in ra tổng a + b.",
    inputDesc: "Một dòng duy nhất chứa hai số nguyên a và b (-10^9 ≤ a, b ≤ 10^9).",
    outputDesc: "In ra một số nguyên duy nhất là tổng của a và b.",
    tests: Array.of(
      { in: "3 5", out: "8" },
      { in: "-10 25", out: "15" },
      { in: "1000000000 1000000000", out: "2000000000" }
    )
  },
  {
    id: "B02",
    title: "Chia quả dưa hấu (Codeforces 4A)",
    diff: 100,
    tag: "rẽ nhánh",
    desc: "Pete và Billy mua một quả dưa hấu nặng w kg. Hai bạn muốn chia quả dưa thành hai phần sao cho mỗi phần đều có cân nặng là một số chẵn dương (lớn hơn 0). Hãy kiểm tra xem có thể chia được hay không.",
    inputDesc: "Dòng duy nhất chứa số nguyên w (1 ≤ w ≤ 100).",
    outputDesc: "In ra YES nếu chia được, ngược lại in ra NO.",
    tests: Array.of(
      { in: "8", out: "YES" },
      { in: "2", out: "NO" },
      { in: "5", out: "NO" },
      { in: "100", out: "YES" }
    )
  },
  {
    id: "B03",
    title: "Đếm số chẵn trong dãy",
    diff: 150,
    tag: "vòng lặp, mảng",
    desc: "Cho dãy gồm n số nguyên dương. Hãy đếm xem trong dãy có bao nhiêu số chia hết cho 2.",
    inputDesc: "Dòng đầu chứa số nguyên n (1 ≤ n ≤ 1000).\nDòng thứ hai chứa n số nguyên cách nhau bởi dấu cách.",
    outputDesc: "In ra số lượng số chẵn đếm được.",
    tests: Array.of(
      { in: "5\n1 2 3 4 6", out: "3" },
      { in: "4\n1 3 5 7", out: "0" },
      { in: "3\n10 20 30", out: "3" }
    )
  }
);
