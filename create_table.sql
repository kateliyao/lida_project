--使用者帳號登入系統
drop table dw.users_info
CREATE TABLE dw.users_info (
id int primary key,
username varchar(20) not NULL,
password varchar(50) not NULL,
role varchar(20) NULL,
staff_menu varchar(50) null,
updated_time datetime DEFAULT NOW()
)

insert dw.users_info(id,username,password,role,staff_menu) values(1,'lda1','lidadmin1','admin',null);
insert dw.users_info(id,username,password,role,staff_menu) values(2,'lda2','lidadmin2','admin',null);
insert dw.users_info(id,username,password,role,staff_menu) values(3,'ld1','ld1','user','蔡小姐#101');
insert dw.users_info(id,username,password,role,staff_menu) values(4,'ld2','ld2','user','施先生#102');
insert dw.users_info(id,username,password,role,staff_menu) values(5,'ld3','ld3','user','楊小姐#103');
insert dw.users_info(id,username,password,role,staff_menu) values(6,'ld4','ld4','user','賴小姐#106');
insert dw.users_info(id,username,password,role,staff_menu) values(7,'ld5','ld5','user','陳小姐#107');
insert dw.users_info(id,username,password,role,staff_menu) values(8,'ld6','ld6','user','洪小姐#108');
insert dw.users_info(id,username,password,role,staff_menu) values(9,'ld7','ld7','user','潘小姐#111');
insert dw.users_info(id,username,password,role,staff_menu) values(10,'ld8','ld8','user','林小姐#168');

--客戶編碼，有一份excel客戶名單可以匯入資料
drop table dw.company_info
CREATE TABLE dw.company_info (
company_id varchar(20) primary key,
company_name varchar(50) not NULL,
updated_time datetime DEFAULT NOW()
)

drop table dw.formA
CREATE TABLE dw.formA (
    form_id VARCHAR(255) PRIMARY KEY,
    company_id varchar(20) not null,
    company_name varchar(50) not NULL,
    form_type varchar(20) DEFAULT 'A',
    form_titleyear INT not null,
    form_titlemonth INT not null,
    revenue DECIMAL(15, 2) not null,
    cost DECIMAL(15, 2) not null,
    expense DECIMAL(15, 2) not null,
    profit DECIMAL(15, 2) not null,
    nonrevenue DECIMAL(15, 2) not null,
    noncost DECIMAL(15, 2) not null,
    income DECIMAL(15, 2) not null,
    revenue_percent DECIMAL(15, 2) DEFAULT 100,
    cost_percent DECIMAL(15, 2) not null,
    expense_percent DECIMAL(15, 2) not null,
    profit_percent DECIMAL(15, 2) not null,
    nonrevenue_percent DECIMAL(15, 2) not null,
    noncost_percent DECIMAL(15, 2) not null,
    income_percent DECIMAL(15, 2) not null,
    ischecked VARCHAR(1) NULL,
    selectedoption varchar(20) NULL,
    netincome_percent DECIMAL(15, 2) NULL,
    netincome DECIMAL(15, 2) NULL,
    extracost DECIMAL(15, 2) NULL,
    extraexpense DECIMAL(15, 2) NULL,
    note VARCHAR(512) NULL,
    staff varchar(20) not null,
    form_submityear INT not null,
    form_submitmonth INT not null,
    form_submitdate INT not null,
    pdf_name VARCHAR(255) NULL,
    form_status int DEFAULT 0,
	user_name varchar(20) not NULL,
	send_mail_pdf_name VARCHAR(255) NULL,
    updated_time datetime DEFAULT NOW()
);

drop table dw.pdf_merge_history
CREATE TABLE dw.pdf_merge_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    system_date VARCHAR(255) NOT NULL,
    merge_pdf_name VARCHAR(255) NOT NULL,
    updated_time datetime DEFAULT NOW()
);

drop table dw.recipient_account
CREATE TABLE dw.recipient_account (
    id INT AUTO_INCREMENT PRIMARY KEY,   -- 設置 id 為自動遞增
    email VARCHAR(50) NOT NULL,          -- 郵件地址
    updated_time DATETIME DEFAULT NOW()  -- 更新時間，默認為當前時間
);


drop table  dw.`service_items`
CREATE TABLE dw.`service_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(10) DEFAULT NULL,
  `subtitle` varchar(30) DEFAULT NULL,
  `fee` varchar(10) DEFAULT NULL,
  `note` varchar(30) DEFAULT NULL,
  `user_name` varchar(20) DEFAULT NULL,
  `updated_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

select * from dw.`service_items`


drop table dw.`quotation_item`
CREATE TABLE dw.`quotation_item` (
  `quotation_id` varchar(12) NOT NULL,
  subtitle_no int DEFAULT NULL,
  `subtitle` varchar(30) DEFAULT NULL,
  `fee` varchar(10) DEFAULT NULL,
  `note` varchar(30) DEFAULT NULL,
  `user_name` varchar(20) DEFAULT NULL,
  `updated_time` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

drop table dw.`quotation`
CREATE TABLE dw.`quotation` (
  `quotation_id` varchar(12) NOT NULL,
  quotation_date date NOT NULL,
  contact_email varchar(35) DEFAULT NULL,
  contact_phone varchar(30) DEFAULT NULL,
  contact_fax varchar(30) DEFAULT NULL,
  contact_person varchar(10) DEFAULT NULL,
  `company_name` varchar(50) DEFAULT NULL,
  `company_contact_person` varchar(10) DEFAULT NULL,
  `subtotal_amount` decimal(15,2) DEFAULT 0,
  `tax_amount` decimal(15,2) DEFAULT 0,
  `total_amount` decimal(15,2) DEFAULT 0,
  pdf_name VARCHAR(255) NULL,
form_status int DEFAULT 0,
  `user_name` varchar(20) DEFAULT NULL,
  send_mail_pdf_name VARCHAR(255) NULL,
  `updated_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`quotation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

select * from dw.`quotation`
select * from dw.`quotation_item`
select * from dw.company_info

drop table dw.`request_payment`
CREATE TABLE dw.`request_payment` (
  `request_payment_id` varchar(12) NOT NULL,
  request_payment_date date NOT NULL,
   `quotation_id` varchar(12) NOT NULL, 
  contact_email varchar(35) DEFAULT NULL,
  contact_phone varchar(30) DEFAULT NULL,
  contact_fax varchar(30) DEFAULT NULL,
  contact_person varchar(10) DEFAULT NULL,
  `company_name` varchar(50) DEFAULT NULL,
  `company_contact_person` varchar(10) DEFAULT NULL,
  `details_subtotal_amount` decimal(15,2) DEFAULT 0,
  `details_tax_amount` decimal(15,2) DEFAULT 0,
  `details_total_amount` decimal(15,2) DEFAULT 0,
  `fees_total_amount` decimal(15,2) DEFAULT 0,
  `final_total_amount` decimal(15,2) DEFAULT 0,
    pdf_name VARCHAR(255) NULL,
form_status int DEFAULT 0,
  `user_name` varchar(20) DEFAULT NULL,
    send_mail_pdf_name VARCHAR(255) NULL,
  `updated_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE dw.`request_payment_item1` (
  `request_payment_id` varchar(12) NOT NULL,
  subtitle_no int DEFAULT NULL,
  `subtitle` varchar(30) DEFAULT NULL,
  `fee` varchar(10) DEFAULT NULL,
  `note` varchar(30) DEFAULT NULL,
  `user_name` varchar(20) DEFAULT NULL,
  `updated_time` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE dw.`request_payment_item2` (
  `request_payment_id` varchar(12) NOT NULL,
  subtitle_no int DEFAULT NULL,
  `subtitle` varchar(30) DEFAULT NULL,
  `fee` varchar(10) DEFAULT NULL,
  `note` varchar(30) DEFAULT NULL,
  `user_name` varchar(20) DEFAULT NULL,
  `updated_time` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
