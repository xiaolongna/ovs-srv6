cmd_/users/binh/openvswitch/datapath/linux/flex_array.o := gcc -Wp,-MD,/users/binh/openvswitch/datapath/linux/.flex_array.o.d  -nostdinc -isystem /usr/lib/gcc/x86_64-linux-gnu/4.6/include -I/users/binh/openvswitch/include -I/users/binh/openvswitch/datapath/linux/compat -I/users/binh/openvswitch/datapath/linux/compat/include  -I/usr/src/linux-headers-3.2.0-56-generic/arch/x86/include -Iarch/x86/include/generated -Iinclude  -include /usr/src/linux-headers-3.2.0-56-generic/include/linux/kconfig.h -Iubuntu/include  -D__KERNEL__ -Wall -Wundef -Wstrict-prototypes -Wno-trigraphs -fno-strict-aliasing -fno-common -Werror-implicit-function-declaration -Wno-format-security -fno-delete-null-pointer-checks -O2 -m64 -mtune=generic -mno-red-zone -mcmodel=kernel -funit-at-a-time -maccumulate-outgoing-args -fstack-protector -DCONFIG_AS_CFI=1 -DCONFIG_AS_CFI_SIGNAL_FRAME=1 -DCONFIG_AS_CFI_SECTIONS=1 -DCONFIG_AS_FXSAVEQ=1 -pipe -Wno-sign-compare -fno-asynchronous-unwind-tables -mno-sse -mno-mmx -mno-sse2 -mno-3dnow -Wframe-larger-than=1024 -Wno-unused-but-set-variable -fno-omit-frame-pointer -fno-optimize-sibling-calls -pg -Wdeclaration-after-statement -Wno-pointer-sign -fno-strict-overflow -fconserve-stack -DCC_HAVE_ASM_GOTO -DVERSION=\"2.0.0\" -I/users/binh/openvswitch/datapath/linux/.. -I/users/binh/openvswitch/datapath/linux/.. -g -include /users/binh/openvswitch/datapath/linux/kcompat.h  -DMODULE  -D"KBUILD_STR(s)=\#s" -D"KBUILD_BASENAME=KBUILD_STR(flex_array)"  -D"KBUILD_MODNAME=KBUILD_STR(openvswitch)" -c -o /users/binh/openvswitch/datapath/linux/.tmp_flex_array.o /users/binh/openvswitch/datapath/linux/flex_array.c

source_/users/binh/openvswitch/datapath/linux/flex_array.o := /users/binh/openvswitch/datapath/linux/flex_array.c

deps_/users/binh/openvswitch/datapath/linux/flex_array.o := \
  /users/binh/openvswitch/datapath/linux/kcompat.h \
  include/linux/version.h \

/users/binh/openvswitch/datapath/linux/flex_array.o: $(deps_/users/binh/openvswitch/datapath/linux/flex_array.o)

$(deps_/users/binh/openvswitch/datapath/linux/flex_array.o):
